import type { ClipCandidate } from './types.js';

const NOW = Date.now();
const ONE_HOUR = 3600 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

function recencyMultiplier(createdAt: Date): number {
  const ageMs = NOW - createdAt.getTime();
  if (ageMs < ONE_HOUR) return 1.0;
  if (ageMs < 6 * ONE_HOUR) return 0.9;
  if (ageMs < ONE_DAY) return 0.75;
  if (ageMs < 3 * ONE_DAY) return 0.55;
  if (ageMs < 7 * ONE_DAY) return 0.35;
  return 0.15;
}

function normalizeUpvotes(upvotes: number): number {
  if (upvotes >= 50000) return 100;
  if (upvotes >= 20000) return 85;
  if (upvotes >= 10000) return 75;
  if (upvotes >= 5000) return 65;
  if (upvotes >= 2000) return 55;
  if (upvotes >= 1000) return 45;
  if (upvotes >= 500) return 35;
  if (upvotes >= 100) return 20;
  return 10;
}

function normalizeViews(views: number): number {
  if (views >= 5_000_000) return 100;
  if (views >= 1_000_000) return 90;
  if (views >= 500_000) return 80;
  if (views >= 100_000) return 65;
  if (views >= 50_000) return 55;
  if (views >= 10_000) return 40;
  if (views >= 1000) return 25;
  return 10;
}

export function scoreCandidate(c: ClipCandidate): ClipCandidate {
  let engagementScore = 50;
  if (c.source === 'reddit' && c.upvotes !== undefined) {
    engagementScore = normalizeUpvotes(c.upvotes);
  } else if (c.source === 'youtube' && c.views !== undefined) {
    engagementScore = normalizeViews(c.views);
  }

  const recency = recencyMultiplier(c.createdAt);
  const rawScore = engagementScore * recency;
  const viralityScore = Math.min(100, Math.round(rawScore));

  return { ...c, viralityScore };
}

export function sortByVirality(candidates: ClipCandidate[]): ClipCandidate[] {
  return [...candidates].sort((a, b) => b.viralityScore - a.viralityScore);
}
