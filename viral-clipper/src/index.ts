#!/usr/bin/env bun
import { runPipeline } from './pipeline.js';
import { startScheduler } from './scheduler.js';
import * as store from './store.js';
import { publishVugolaJob, pollVugolaJob, listVugolaAccounts } from './vugola.js';
import { checkRequiredKeys } from './config.js';

const HELP = `
viral-clipper — FIFA viral moment scouter → Vugola AI clip generator

COMMANDS

  run              Scout + score + compliance only (dry-run, no Vugola call)
  run --draft      Full pipeline → create Vugola draft jobs
  run --publish    Full pipeline → publish live (requires ENABLE_AUTO_PUBLISH=true)
  schedule         Start continuous scheduler (draft mode; never auto-publishes)
  status           Show recent jobs and audit log
  approve <jobId>  Mark a draft job as human-approved (required before publish)
  reject  <jobId>  Reject a job with an optional reason
  publish <jobId>  Publish a human-approved job to all connected platforms
  retry   <jobId>  Retry a failed_retryable job
  accounts         List social accounts connected via Vugola

SETUP

  1. Sign up at https://vugolaai.com → connect YouTube/Instagram/TikTok
  2. Copy .env.example → .env, fill in VUGOLA_API_KEY + YOUTUBE_API_KEY
  3. bun src/index.ts accounts   # verify connections
  4. bun src/index.ts run        # dry-run scout
  5. bun src/index.ts run --draft  # create draft clips
  6. bun src/index.ts approve <jobId>
  7. bun src/index.ts publish <jobId>
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0] ?? 'help';

  checkRequiredKeys();

  switch (cmd) {
    case 'run': {
      const draft = args.includes('--draft');
      const publish = args.includes('--publish');
      const result = await runPipeline({ draft, publish });
      console.log('\n[done]', JSON.stringify({
        scouted: result.scouted, blocked: result.blocked,
        submitted: result.submitted, jobIds: result.jobIds,
      }, null, 2));
      break;
    }

    case 'schedule': {
      startScheduler();
      break;
    }

    case 'status': {
      const jobs = store.getRecentJobs(20);
      const audit = store.getRecentAuditLog(10);

      console.log('\n=== Recent Jobs ===');
      if (jobs.length === 0) {
        console.log('  (none yet — run `bun src/index.ts run --draft` to create jobs)');
      } else {
        for (const j of jobs) {
          const approved = j.approvedByHuman ? '✓ approved' : '⏳ pending review';
          console.log(`  ${j.jobId.slice(0, 8)}  [${j.status.padEnd(16)}]  ${approved}  "${j.clipTitle.slice(0, 50)}"`);
        }
      }

      console.log('\n=== Recent Audit Log ===');
      for (const e of audit) {
        const sym = e.status === 'blocked' ? '🚫' : e.approvedByHuman ? '✅' : '📋';
        console.log(`  ${sym} [${e.status.padEnd(12)}] risk:${e.riskScore.toString().padStart(3)}  "${e.title.slice(0, 50)}"`);
        if (e.rejectionReason) console.log(`       Reason: ${e.rejectionReason}`);
      }
      break;
    }

    case 'approve': {
      const jobId = args[1];
      if (!jobId) { console.error('Usage: approve <jobId>'); process.exit(1); }
      const job = store.getJob(jobId);
      if (!job) { console.error(`Job ${jobId} not found`); process.exit(1); }
      store.updateJob(jobId, { approvedByHuman: true, approvedAt: new Date() });
      console.log(`[approve] Job ${jobId} marked as human-approved.`);
      console.log(`          Run: bun src/index.ts publish ${jobId}`);
      break;
    }

    case 'reject': {
      const jobId = args[1];
      const reason = args.slice(2).join(' ') || 'rejected by user';
      if (!jobId) { console.error('Usage: reject <jobId> [reason]'); process.exit(1); }
      const job = store.getJob(jobId);
      if (!job) { console.error(`Job ${jobId} not found`); process.exit(1); }
      store.updateJob(jobId, { status: 'failed', rejectionReason: reason });
      console.log(`[reject] Job ${jobId} rejected: ${reason}`);
      break;
    }

    case 'publish': {
      const jobId = args[1];
      if (!jobId) { console.error('Usage: publish <jobId>'); process.exit(1); }
      const job = store.getJob(jobId);
      if (!job) { console.error(`Job ${jobId} not found`); process.exit(1); }
      if (!job.approvedByHuman) {
        console.error(`Job ${jobId} has not been approved. Run: approve ${jobId}`);
        process.exit(1);
      }
      if (!job.jobId) { console.error(`Job ${jobId} has no Vugola job ID`); process.exit(1); }

      try {
        await publishVugolaJob(job.jobId);
        store.updateJob(jobId, { status: 'done', completedAt: new Date() });
        console.log(`[publish] Job ${jobId} published successfully.`);
      } catch (err) {
        const msg = (err as Error).message;
        store.updateJob(jobId, { status: 'failed_retryable', errorMessage: msg });
        console.error(`[publish] Failed: ${msg}`);
        process.exit(1);
      }
      break;
    }

    case 'retry': {
      const jobId = args[1];
      if (!jobId) { console.error('Usage: retry <jobId>'); process.exit(1); }
      const job = store.getJob(jobId);
      if (!job) { console.error(`Job ${jobId} not found`); process.exit(1); }
      if (job.status !== 'failed_retryable') {
        console.error(`Job ${jobId} status is '${job.status}' — only failed_retryable jobs can be retried`);
        process.exit(1);
      }
      console.log(`[retry] Re-queuing job ${jobId}...`);
      store.updateJob(jobId, { status: 'pending', errorMessage: undefined });
      console.log(`[retry] Job reset to 'pending'. Run pipeline again to resubmit.`);
      break;
    }

    case 'poll': {
      const jobId = args[1];
      if (!jobId) { console.error('Usage: poll <jobId>'); process.exit(1); }
      const job = store.getJob(jobId);
      if (!job) { console.error(`Job ${jobId} not found`); process.exit(1); }
      const update = await pollVugolaJob(job.jobId);
      store.updateJob(jobId, {
        status: update.status,
        clipUrl: update.clipUrl,
        errorMessage: update.errorMessage,
        ...(update.status === 'done' ? { completedAt: new Date() } : {}),
      });
      console.log(`[poll] Job ${jobId}: status=${update.status}${update.clipUrl ? ` clipUrl=${update.clipUrl}` : ''}`);
      break;
    }

    case 'accounts': {
      try {
        const accounts = await listVugolaAccounts();
        if (accounts.length === 0) {
          console.log('[accounts] No accounts connected. Visit https://vugolaai.com to connect.');
        } else {
          console.log('[accounts] Connected social accounts:');
          for (const a of accounts) {
            console.log(`  ${a.connected ? '✓' : '✗'} ${a.platform.padEnd(12)} @${a.handle}`);
          }
        }
      } catch (err) {
        console.error(`[accounts] ${(err as Error).message}`);
        process.exit(1);
      }
      break;
    }

    case 'help':
    case '--help':
    case '-h':
    default:
      console.log(HELP);
  }

  store.closeDb();
}

main().catch(err => {
  // Redact any credential values from error output
  const msg = String(err).replace(/Bearer \S+/g, 'Bearer [redacted]');
  console.error('[fatal]', msg);
  process.exit(1);
});
