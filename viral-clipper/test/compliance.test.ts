import { describe, test, expect } from 'bun:test';
import { checkCompliance } from '../src/compliance.js';
import type { ClipCandidate } from '../src/types.js';

function makeCandidate(overrides: Partial<ClipCandidate> = {}): ClipCandidate {
  return {
    id: 'test-id',
    url: 'https://example.com/clip',
    title: 'Fan reaction to amazing goal',
    source: 'reddit',
    sourceType: 'ugc',
    viralityScore: 80,
    copyrightRiskScore: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('checkCompliance — metadata_only mode (default)', () => {
  // Default env has LICENSE_MODE=metadata_only

  test('blocks ugc content in metadata_only mode', () => {
    const result = checkCompliance(makeCandidate({ sourceType: 'ugc' }));
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('metadata_only');
  });

  test('blocks official content', () => {
    const result = checkCompliance(makeCandidate({ sourceType: 'official' }));
    expect(result.approved).toBe(false);
    expect(result.riskScore).toBeGreaterThanOrEqual(70);
  });

  test('blocks unknown sources', () => {
    const result = checkCompliance(makeCandidate({ sourceType: 'unknown' }));
    expect(result.approved).toBe(false);
    expect(result.riskScore).toBeGreaterThanOrEqual(50);
  });

  test('allows licensed content', () => {
    const result = checkCompliance(makeCandidate({ sourceType: 'licensed' }));
    expect(result.approved).toBe(true);
  });

  test('allows user_owned content', () => {
    const result = checkCompliance(makeCandidate({ sourceType: 'user_owned' }));
    expect(result.approved).toBe(true);
  });

  test('copyright marks in title raise risk for licensed content', () => {
    const clean = checkCompliance(makeCandidate({ sourceType: 'licensed', title: 'My own footage' }));
    const marked = checkCompliance(makeCandidate({
      sourceType: 'licensed',
      title: 'FIFA™ official broadcast all rights reserved',
    }));
    expect(marked.riskScore).toBeGreaterThan(clean.riskScore);
  });

  test('long duration raises risk', () => {
    const short = checkCompliance(makeCandidate({ sourceType: 'licensed', duration: 45 }));
    const long = checkCompliance(makeCandidate({ sourceType: 'licensed', duration: 300 }));
    expect(long.riskScore).toBeGreaterThan(short.riskScore);
  });

  test('risk score is written back to candidate', () => {
    const c = makeCandidate({ sourceType: 'official' });
    checkCompliance(c);
    expect(c.copyrightRiskScore).toBeGreaterThan(0);
  });
});
