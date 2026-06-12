import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Point the store at a temp dir BEFORE importing it
const tmp = mkdtempSync(join(tmpdir(), 'viral-clipper-test-'));
process.env['DATA_DIR'] = tmp;

const store = await import('../src/store.js');
import type { ClipCandidate } from '../src/types.js';

function makeCandidate(overrides: Partial<ClipCandidate> = {}): ClipCandidate {
  return {
    id: crypto.randomUUID(),
    url: `https://example.com/${crypto.randomUUID()}`,
    title: 'Test clip',
    source: 'reddit',
    sourceType: 'ugc',
    viralityScore: 80,
    copyrightRiskScore: 10,
    createdAt: new Date(),
    ...overrides,
  };
}

afterAll(() => {
  store.closeDb();
  rmSync(tmp, { recursive: true, force: true });
});

describe('store', () => {
  test('saveCandidate + isDuplicate', () => {
    const c = makeCandidate();
    expect(store.isDuplicate(c.url)).toBe(false);
    store.saveCandidate(c);
    expect(store.isDuplicate(c.url)).toBe(true);
  });

  test('duplicate URLs are ignored on insert', () => {
    const c = makeCandidate();
    store.saveCandidate(c);
    // Same URL, different id — should not throw
    store.saveCandidate({ ...c, id: crypto.randomUUID() });
    expect(store.isDuplicate(c.url)).toBe(true);
  });

  test('job lifecycle: save → approve → fetch', () => {
    const c = makeCandidate();
    store.saveCandidate(c);
    const jobId = crypto.randomUUID();
    store.saveJob({
      jobId, clipId: c.id, status: 'pending', platforms: ['youtube'],
      approvedByHuman: false, createdAt: new Date(),
    });

    let job = store.getJob(jobId);
    expect(job).not.toBeNull();
    expect(job!.approvedByHuman).toBe(false);

    store.updateJob(jobId, { approvedByHuman: true, approvedAt: new Date() });
    job = store.getJob(jobId);
    expect(job!.approvedByHuman).toBe(true);
    expect(job!.approvedAt).toBeInstanceOf(Date);
  });

  test('retryable jobs are queryable', () => {
    const c = makeCandidate();
    store.saveCandidate(c);
    const jobId = crypto.randomUUID();
    store.saveJob({
      jobId, clipId: c.id, status: 'pending', platforms: ['youtube'],
      approvedByHuman: false, createdAt: new Date(),
    });
    store.updateJob(jobId, { status: 'failed_retryable', errorMessage: 'network blip' });

    const retryable = store.getRetryableJobs();
    expect(retryable.some(j => j.jobId === jobId)).toBe(true);
  });

  test('audit log round-trip', () => {
    const c = makeCandidate();
    store.logAudit({
      clipId: c.id, sourceUrl: c.url, sourceType: 'ugc', licenseMode: 'metadata_only',
      viralityScore: 80, riskScore: 10, title: c.title, platforms: 'youtube',
      status: 'blocked', approvedByHuman: false,
      rejectionReason: 'test reason', timestamp: new Date().toISOString(),
    });
    const log = store.getRecentAuditLog(5);
    const entry = log.find(e => e.clipId === c.id);
    expect(entry).toBeDefined();
    expect(entry!.rejectionReason).toBe('test reason');
    expect(entry!.status).toBe('blocked');
  });
});
