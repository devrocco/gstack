import { describe, test, expect } from 'bun:test';
import { scoreCandidate, sortByVirality } from '../src/scorer.js';
import type { ClipCandidate } from '../src/types.js';

function makeCandidate(overrides: Partial<ClipCandidate> = {}): ClipCandidate {
  return {
    id: 'test-id',
    url: 'https://example.com/clip',
    title: 'Test clip',
    source: 'reddit',
    sourceType: 'ugc',
    viralityScore: 0,
    copyrightRiskScore: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('scoreCandidate', () => {
  test('high upvotes + recent = high score', () => {
    const c = scoreCandidate(makeCandidate({ upvotes: 50000, createdAt: new Date() }));
    expect(c.viralityScore).toBeGreaterThanOrEqual(90);
  });

  test('low upvotes = low score', () => {
    const c = scoreCandidate(makeCandidate({ upvotes: 100, createdAt: new Date() }));
    expect(c.viralityScore).toBeLessThan(30);
  });

  test('old content decays', () => {
    const fresh = scoreCandidate(makeCandidate({ upvotes: 10000, createdAt: new Date() }));
    const week = scoreCandidate(makeCandidate({
      upvotes: 10000,
      createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
    }));
    expect(week.viralityScore).toBeLessThan(fresh.viralityScore);
  });

  test('youtube views scored', () => {
    const c = scoreCandidate(makeCandidate({
      source: 'youtube', views: 5_000_000, upvotes: undefined, createdAt: new Date(),
    }));
    expect(c.viralityScore).toBeGreaterThanOrEqual(90);
  });

  test('score capped at 100', () => {
    const c = scoreCandidate(makeCandidate({ upvotes: 999999, createdAt: new Date() }));
    expect(c.viralityScore).toBeLessThanOrEqual(100);
  });
});

describe('sortByVirality', () => {
  test('sorts descending without mutating input', () => {
    const a = makeCandidate({ id: 'a', viralityScore: 30 });
    const b = makeCandidate({ id: 'b', viralityScore: 90 });
    const input = [a, b];
    const sorted = sortByVirality(input);
    expect(sorted[0].id).toBe('b');
    expect(input[0].id).toBe('a'); // original untouched
  });
});
