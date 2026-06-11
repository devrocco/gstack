import { Database } from 'bun:sqlite';
import { mkdirSync } from 'fs';
import { config } from './config.js';
import type { ClipCandidate, VugolaJob, AuditEntry, JobStatus } from './types.js';

let _db: Database | null = null;

function db(): Database {
  if (_db) return _db;
  mkdirSync(config.dataDir, { recursive: true });
  _db = new Database(`${config.dataDir}/store.db`);
  _db.exec(`PRAGMA journal_mode=WAL;`);
  migrate(_db);
  return _db;
}

function migrate(d: Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS clips (
      id TEXT PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      source_type TEXT NOT NULL,
      license_mode TEXT NOT NULL,
      virality_score INTEGER NOT NULL,
      risk_score INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'discovered',
      thumbnail TEXT,
      discovered_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      clip_id TEXT NOT NULL REFERENCES clips(id),
      vugola_job_id TEXT,
      platforms TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'draft',
      status TEXT NOT NULL DEFAULT 'pending',
      approved_by_human INTEGER NOT NULL DEFAULT 0,
      approved_at TEXT,
      rejection_reason TEXT,
      error_message TEXT,
      clip_url TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clip_id TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_type TEXT NOT NULL,
      license_mode TEXT NOT NULL,
      virality_score INTEGER NOT NULL,
      risk_score INTEGER NOT NULL,
      title TEXT NOT NULL,
      platforms TEXT NOT NULL,
      status TEXT NOT NULL,
      approved_by_human INTEGER NOT NULL DEFAULT 0,
      approved_at TEXT,
      rejection_reason TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_clips_url ON clips(url);
    CREATE INDEX IF NOT EXISTS idx_clips_status ON clips(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_clip_id ON jobs(clip_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  `);
}

export function saveCandidate(c: ClipCandidate): void {
  db().run(`
    INSERT OR IGNORE INTO clips
      (id, url, title, source, source_type, license_mode, virality_score, risk_score, status, thumbnail, discovered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'discovered', ?, ?)
  `, [c.id, c.url, c.title, c.source, c.sourceType, config.safety.licenseMode,
      c.viralityScore, c.copyrightRiskScore, c.thumbnail ?? null, c.createdAt.toISOString()]);
}

export function isDuplicate(url: string): boolean {
  const row = db().query<{ id: string }, [string]>(
    'SELECT id FROM clips WHERE url = ? LIMIT 1'
  ).get(url);
  return row !== null;
}

export function updateClipStatus(id: string, status: string): void {
  db().run('UPDATE clips SET status = ? WHERE id = ?', [status, id]);
}

export function saveJob(job: VugolaJob): void {
  db().run(`
    INSERT OR REPLACE INTO jobs
      (id, clip_id, vugola_job_id, platforms, mode, status, approved_by_human, approved_at,
       rejection_reason, error_message, clip_url, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    job.jobId, job.clipId, null, job.platforms.join(','), 'draft', job.status,
    0, null, null, job.errorMessage ?? null, job.clipUrl ?? null,
    job.createdAt.toISOString(), null
  ]);
}

export function updateJob(jobId: string, fields: Partial<{
  vugolaJobId: string; status: JobStatus; approvedByHuman: boolean;
  approvedAt: Date; rejectionReason: string; clipUrl: string;
  errorMessage: string; completedAt: Date;
}>): void {
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (fields.vugolaJobId !== undefined) { sets.push('vugola_job_id = ?'); vals.push(fields.vugolaJobId); }
  if (fields.status !== undefined) { sets.push('status = ?'); vals.push(fields.status); }
  if (fields.approvedByHuman !== undefined) { sets.push('approved_by_human = ?'); vals.push(fields.approvedByHuman ? 1 : 0); }
  if (fields.approvedAt !== undefined) { sets.push('approved_at = ?'); vals.push(fields.approvedAt.toISOString()); }
  if (fields.rejectionReason !== undefined) { sets.push('rejection_reason = ?'); vals.push(fields.rejectionReason); }
  if (fields.clipUrl !== undefined) { sets.push('clip_url = ?'); vals.push(fields.clipUrl); }
  if (fields.errorMessage !== undefined) { sets.push('error_message = ?'); vals.push(fields.errorMessage); }
  if (fields.completedAt !== undefined) { sets.push('completed_at = ?'); vals.push(fields.completedAt.toISOString()); }
  if (sets.length === 0) return;
  vals.push(jobId);
  db().run(`UPDATE jobs SET ${sets.join(', ')} WHERE id = ?`, vals as string[]);
}

export function getJob(jobId: string): VugolaJob | null {
  const row = db().query<{
    id: string; clip_id: string; status: string; platforms: string;
    approved_by_human: number; approved_at: string | null;
    rejection_reason: string | null; clip_url: string | null;
    error_message: string | null; created_at: string;
  }, [string]>('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!row) return null;
  return {
    jobId: row.id, clipId: row.clip_id, status: row.status as JobStatus,
    platforms: row.platforms.split(','), approvedByHuman: row.approved_by_human === 1,
    approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    clipUrl: row.clip_url ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export function getRetryableJobs(): VugolaJob[] {
  return db().query<{
    id: string; clip_id: string; status: string; platforms: string;
    approved_by_human: number; approved_at: string | null;
    rejection_reason: string | null; clip_url: string | null;
    error_message: string | null; created_at: string;
  }, []>(`SELECT * FROM jobs WHERE status = 'failed_retryable'`).all().map(row => ({
    jobId: row.id, clipId: row.clip_id, status: row.status as JobStatus,
    platforms: row.platforms.split(','), approvedByHuman: row.approved_by_human === 1,
    approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    clipUrl: row.clip_url ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: new Date(row.created_at),
  }));
}

export function logAudit(entry: AuditEntry): void {
  db().run(`
    INSERT INTO audit_log
      (clip_id, source_url, source_type, license_mode, virality_score, risk_score, title,
       platforms, status, approved_by_human, approved_at, rejection_reason, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    entry.clipId, entry.sourceUrl, entry.sourceType, entry.licenseMode,
    entry.viralityScore, entry.riskScore, entry.title, entry.platforms, entry.status,
    entry.approvedByHuman ? 1 : 0, entry.approvedAt ?? null, entry.rejectionReason ?? null,
    entry.timestamp,
  ]);
}

export function getRecentAuditLog(limit = 20): AuditEntry[] {
  return db().query<{
    clip_id: string; source_url: string; source_type: string; license_mode: string;
    virality_score: number; risk_score: number; title: string; platforms: string;
    status: string; approved_by_human: number; approved_at: string | null;
    rejection_reason: string | null; timestamp: string;
  }, [number]>(`SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?`).all(limit).map(r => ({
    clipId: r.clip_id, sourceUrl: r.source_url, sourceType: r.source_type as AuditEntry['sourceType'],
    licenseMode: r.license_mode as AuditEntry['licenseMode'], viralityScore: r.virality_score,
    riskScore: r.risk_score, title: r.title, platforms: r.platforms, status: r.status,
    approvedByHuman: r.approved_by_human === 1, approvedAt: r.approved_at ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined, timestamp: r.timestamp,
  }));
}

export function getRecentJobs(limit = 20): Array<{
  jobId: string; clipTitle: string; platforms: string; status: string;
  approvedByHuman: boolean; createdAt: string;
}> {
  return db().query<{
    id: string; title: string; platforms: string; status: string;
    approved_by_human: number; created_at: string;
  }, [number]>(`
    SELECT j.id, c.title, j.platforms, j.status, j.approved_by_human, j.created_at
    FROM jobs j JOIN clips c ON j.clip_id = c.id
    ORDER BY j.created_at DESC LIMIT ?
  `).all(limit).map(r => ({
    jobId: r.id, clipTitle: r.title, platforms: r.platforms, status: r.status,
    approvedByHuman: r.approved_by_human === 1, createdAt: r.created_at,
  }));
}

export function closeDb(): void {
  _db?.close();
  _db = null;
}
