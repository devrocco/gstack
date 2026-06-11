import { scoutContent } from './scraper/index.js';
import { scoreCandidate, sortByVirality } from './scorer.js';
import { checkCompliance } from './compliance.js';
import { generateScript } from './script-gen.js';
import { createVugolaJob } from './vugola.js';
import * as store from './store.js';
import { config } from './config.js';
import type { ClipCandidate, PipelineResult } from './types.js';

async function promptApproval(candidates: ClipCandidate[]): Promise<ClipCandidate[]> {
  console.log('\n[review] Candidates pending review:\n');
  candidates.forEach((c, i) => {
    console.log(`  [${i + 1}] ${c.title}`);
    console.log(`       Source: ${c.source} (${c.sourceType}) | Virality: ${c.viralityScore} | Risk: ${c.copyrightRiskScore}`);
    console.log(`       URL: ${c.url}\n`);
  });

  // In non-interactive mode (scheduler), skip if REVIEW_REQUIRED=false
  if (!process.stdin.isTTY) {
    if (config.safety.reviewRequired) {
      console.log('[review] REVIEW_REQUIRED=true but running non-interactively — skipping all candidates.');
      console.log('         Run with --draft manually to review and approve.');
      return [];
    }
    return candidates;
  }

  const approved: ClipCandidate[] = [];
  const { createInterface } = await import('readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const ask = (q: string): Promise<string> =>
    new Promise(res => rl.question(q, res));

  for (const c of candidates) {
    const ans = await ask(`  Approve "${c.title.slice(0, 60)}"? (y/n/q) `);
    if (ans.toLowerCase() === 'q') break;
    if (ans.toLowerCase() === 'y') approved.push(c);
  }
  rl.close();
  return approved;
}

export async function runPipeline(opts: { draft?: boolean; publish?: boolean } = {}): Promise<PipelineResult> {
  const result: PipelineResult = {
    scouted: 0, duplicates: 0, belowThreshold: 0,
    blocked: 0, scripted: 0, submitted: 0, jobIds: [],
  };

  // Step 1: Scout
  const raw = await scoutContent();
  result.scouted = raw.length;
  console.log(`[pipeline] Scouted ${raw.length} candidates`);

  // Step 2: Deduplicate
  const fresh = raw.filter(c => {
    if (store.isDuplicate(c.url)) { result.duplicates++; return false; }
    return true;
  });
  console.log(`[pipeline] ${fresh.length} new (${result.duplicates} already seen)`);

  // Step 3: Score + filter
  const scored = fresh.map(scoreCandidate);
  const above = scored.filter(c => {
    if (c.viralityScore < config.pipeline.minViralityScore) {
      result.belowThreshold++;
      return false;
    }
    return true;
  });
  console.log(`[pipeline] ${above.length} above virality threshold ${config.pipeline.minViralityScore}`);

  // Save all discovered candidates
  for (const c of scored) store.saveCandidate(c);

  // Step 4: Compliance gate
  const compliant: ClipCandidate[] = [];
  for (const c of above) {
    const check = checkCompliance(c);
    if (!check.approved) {
      result.blocked++;
      store.updateClipStatus(c.id, 'blocked');
      store.logAudit({
        clipId: c.id, sourceUrl: c.url, sourceType: c.sourceType,
        licenseMode: config.safety.licenseMode,
        viralityScore: c.viralityScore, riskScore: check.riskScore,
        title: c.title, platforms: config.pipeline.enabledPlatforms.join(','),
        status: 'blocked', approvedByHuman: false,
        rejectionReason: check.reason, timestamp: new Date().toISOString(),
      });
      console.log(`[compliance] BLOCKED: "${c.title.slice(0, 60)}" — ${check.reason}`);
    } else {
      compliant.push(c);
    }
  }
  console.log(`[pipeline] ${compliant.length} passed compliance (${result.blocked} blocked)`);

  if (!opts.draft && !opts.publish) {
    console.log('\n[pipeline] Dry-run complete. Use --draft to create Vugola jobs.');
    return result;
  }

  // Step 5: Script generation
  const top = sortByVirality(compliant).slice(0, config.pipeline.maxClipsPerRun);
  const scripted = top.map(c => ({ candidate: c, script: generateScript(c) }));
  result.scripted = scripted.length;

  // Step 6: Human review gate
  const toSubmit = config.safety.reviewRequired
    ? await promptApproval(scripted.map(s => s.candidate))
    : scripted.map(s => s.candidate);

  // Step 7: Submit to Vugola
  const mode = opts.publish && config.safety.enableAutoPublish ? 'publish' : 'draft';
  for (const candidate of toSubmit) {
    const scriptEntry = scripted.find(s => s.candidate.id === candidate.id)!;
    const job = await createVugolaJob(
      candidate, scriptEntry.script, config.pipeline.enabledPlatforms, mode
    );
    store.saveJob(job);
    store.updateClipStatus(candidate.id, job.status === 'failed_retryable' ? 'discovered' : 'submitted');
    store.logAudit({
      clipId: candidate.id, sourceUrl: candidate.url, sourceType: candidate.sourceType,
      licenseMode: config.safety.licenseMode,
      viralityScore: candidate.viralityScore, riskScore: candidate.copyrightRiskScore,
      title: scriptEntry.script.title, platforms: config.pipeline.enabledPlatforms.join(','),
      status: job.status, approvedByHuman: false, timestamp: new Date().toISOString(),
    });
    result.submitted++;
    result.jobIds.push(job.jobId);

    if (job.status === 'failed_retryable') {
      console.warn(`[vugola] Job ${job.jobId} failed (retryable): ${job.errorMessage}`);
    } else {
      console.log(`[vugola] Job ${job.jobId} created for "${candidate.title.slice(0, 60)}"`);
    }
  }

  return result;
}
