import { config } from './config.js';
import type { ClipCandidate, ComplianceResult } from './types.js';

const COPYRIGHT_PATTERNS = [
  /\bFIFA™\b/i, /\bWorld Cup™\b/i, /©\s*FIFA/i,
  /all rights reserved/i, /official broadcast/i, /licensed to/i,
  /\bUEFA™\b/i, /broadcast rights/i,
];

function hasCopyrightMarks(title: string): boolean {
  return COPYRIGHT_PATTERNS.some(p => p.test(title));
}

export function checkCompliance(c: ClipCandidate): ComplianceResult {
  let riskScore = 0;
  const reasons: string[] = [];

  if (c.sourceType === 'official') {
    riskScore += 70;
    reasons.push('official channel (broadcast rights likely held)');
  } else if (c.sourceType === 'unknown') {
    riskScore += 50;
    reasons.push('unknown source type');
  } else if (c.sourceType === 'news') {
    riskScore += 30;
    reasons.push('news/media outlet (may have licensing restrictions)');
  }

  // In metadata_only mode, block everything that isn't explicitly licensed/owned
  if (config.safety.licenseMode === 'metadata_only' &&
      c.sourceType !== 'licensed' && c.sourceType !== 'user_owned') {
    c.copyrightRiskScore = riskScore;
    return {
      approved: false,
      riskScore,
      reason: `LICENSE_MODE=metadata_only blocks video processing for source type '${c.sourceType}'. ` +
        `Set source as 'licensed' or 'user_owned' to proceed.`,
    };
  }

  if (hasCopyrightMarks(c.title)) {
    riskScore += 20;
    reasons.push('title contains copyright marks');
  }

  if (c.duration && c.duration > 120) {
    riskScore += 20;
    reasons.push(`duration ${c.duration}s > 120s threshold`);
  }

  // Assign the risk score back
  c.copyrightRiskScore = riskScore;

  if (riskScore > config.pipeline.maxRiskScore) {
    return {
      approved: false,
      riskScore,
      reason: `Risk score ${riskScore} exceeds threshold ${config.pipeline.maxRiskScore}: ${reasons.join('; ')}`,
    };
  }

  return { approved: true, riskScore };
}
