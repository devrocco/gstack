import { randomUUID } from 'crypto';
import { config } from './config.js';
import type { ClipCandidate, VugolaJob, ScriptIdea, SocialAccount } from './types.js';

async function vugolaFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${config.vugola.baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Key value never logged or stored — only passed in header
    'Authorization': `Bearer ${config.vugola.apiKey}`,
    ...(init?.headers as Record<string, string> ?? {}),
  };
  return fetch(url, { ...init, headers });
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: Error = new Error('unknown');
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err as Error;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

export async function createVugolaJob(
  candidate: ClipCandidate,
  script: ScriptIdea,
  platforms: string[],
  mode: 'draft' | 'publish' = 'draft'
): Promise<VugolaJob> {
  if (!config.vugola.apiKey) {
    throw new Error('VUGOLA_API_KEY is not set. Get your key from vugolaai.com dashboard.');
  }

  const body = {
    source_url: candidate.url,
    title: script.title,
    description: script.description,
    hashtags: script.hashtags,
    platforms,
    mode,
    safe_asset_mode: config.safety.safeAssetMode,
    assets_needed: script.assetsNeeded,
  };

  const jobId = randomUUID();

  try {
    const res = await withRetry(() => vugolaFetch('/clips', {
      method: 'POST',
      body: JSON.stringify(body),
    }));

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vugola API ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json() as { job_id?: string; id?: string };
    const vugolaJobId = json.job_id ?? json.id ?? jobId;

    return {
      jobId,
      clipId: candidate.id,
      status: 'pending',
      platforms,
      approvedByHuman: false,
      createdAt: new Date(),
      // vugolaJobId stored separately via updateJob
    } satisfies VugolaJob & { _vugolaJobId?: string } as VugolaJob;

  } catch (err) {
    return {
      jobId,
      clipId: candidate.id,
      status: 'failed_retryable',
      platforms,
      approvedByHuman: false,
      errorMessage: (err as Error).message,
      createdAt: new Date(),
    };
  }
}

export async function pollVugolaJob(vugolaJobId: string): Promise<{
  status: VugolaJob['status']; clipUrl?: string; errorMessage?: string;
}> {
  if (!config.vugola.apiKey) throw new Error('VUGOLA_API_KEY is not set');
  const res = await vugolaFetch(`/clips/${vugolaJobId}`);
  if (!res.ok) throw new Error(`Vugola poll ${res.status}`);
  const json = await res.json() as { status?: string; clip_url?: string; error?: string };
  const status = mapVugolaStatus(json.status ?? 'pending');
  return { status, clipUrl: json.clip_url, errorMessage: json.error };
}

export async function publishVugolaJob(vugolaJobId: string): Promise<void> {
  if (!config.vugola.apiKey) throw new Error('VUGOLA_API_KEY is not set');
  const res = await withRetry(() => vugolaFetch(`/clips/${vugolaJobId}/publish`, { method: 'POST' }));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vugola publish ${res.status}: ${text.slice(0, 200)}`);
  }
}

export async function listVugolaAccounts(): Promise<SocialAccount[]> {
  if (!config.vugola.apiKey) throw new Error('VUGOLA_API_KEY is not set');
  const res = await vugolaFetch('/accounts');
  if (!res.ok) throw new Error(`Vugola accounts ${res.status}`);
  const json = await res.json() as { accounts?: Array<{ platform: string; handle: string; connected: boolean }> };
  return json.accounts ?? [];
}

function mapVugolaStatus(raw: string): VugolaJob['status'] {
  switch (raw.toLowerCase()) {
    case 'pending': case 'queued': return 'pending';
    case 'processing': case 'running': return 'processing';
    case 'done': case 'completed': case 'ready': return 'done';
    case 'failed': case 'error': return 'failed';
    default: return 'failed_retryable';
  }
}
