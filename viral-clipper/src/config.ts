import type { LicenseMode } from './types.js';

function get(key: string, fallback?: string): string {
  const val = process.env[key];
  if (val !== undefined && val !== '') return val;
  if (fallback !== undefined) return fallback;
  throw new Error(`Required env var ${key} is not set. Copy .env.example → .env and fill it in.`);
}

function getBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  if (val === undefined || val === '') return fallback;
  return val.toLowerCase() === 'true' || val === '1';
}

function getInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (val === undefined || val === '') return fallback;
  const n = parseInt(val, 10);
  if (isNaN(n)) throw new Error(`Env var ${key} must be an integer, got: [redacted]`);
  return n;
}

function getKeywords(): string[] {
  const raw = process.env['KEYWORDS'] ??
    'FIFA World Cup 2026,World Cup goal,World Cup highlights,FIFA 2026 goal';
  return raw.split(',').map(k => k.trim()).filter(Boolean);
}

function getEnabledPlatforms(): string[] {
  const platforms: string[] = [];
  if (getBool('ENABLE_YOUTUBE', true)) platforms.push('youtube');
  if (getBool('ENABLE_INSTAGRAM', false)) platforms.push('instagram');
  if (getBool('ENABLE_TIKTOK', false)) platforms.push('tiktok');
  if (getBool('ENABLE_FACEBOOK', false)) platforms.push('facebook');
  if (getBool('ENABLE_TWITTER', false)) platforms.push('twitter');
  return platforms;
}

export const config = {
  vugola: {
    apiKey: get('VUGOLA_API_KEY', ''),
    baseUrl: 'https://api.vugolaai.com/v1',
  },
  youtube: {
    apiKey: get('YOUTUBE_API_KEY', ''),
  },
  safety: {
    licenseMode: get('LICENSE_MODE', 'metadata_only') as LicenseMode,
    safeAssetMode: getBool('SAFE_ASSET_MODE', true),
    publishMode: get('PUBLISH_MODE', 'draft') as 'draft' | 'public',
    reviewRequired: getBool('REVIEW_REQUIRED', true),
    enableAutoPublish: getBool('ENABLE_AUTO_PUBLISH', false),
  },
  pipeline: {
    minViralityScore: getInt('MIN_VIRALITY_SCORE', 60),
    maxRiskScore: getInt('MAX_RISK_SCORE', 40),
    maxClipsPerRun: getInt('MAX_CLIPS_PER_RUN', 3),
    scheduleInterval: get('SCHEDULE_INTERVAL', '*/30 * * * *'),
    keywords: getKeywords(),
    enabledPlatforms: getEnabledPlatforms(),
  },
  reddit: {
    clientId: process.env['REDDIT_CLIENT_ID'],
    clientSecret: process.env['REDDIT_CLIENT_SECRET'],
    // Covers all 5 content categories
    subreddits: [
      'soccer',           // viral moments, reactions, World Cup
      'worldcup',         // World Cup 2026 content
      'football',         // UK football / stories / wonderkids
      'sports',           // cross-sport viral moments
      'footballhighlights', // dedicated highlight clips
    ],
    minUpvotes: 100,
  },
  dataDir: process.env['DATA_DIR'] ?? `${process.env['HOME']}/.viral-clipper`,
} as const;

export function checkRequiredKeys(): void {
  const missing: string[] = [];
  if (!config.vugola.apiKey) missing.push('VUGOLA_API_KEY');
  if (!config.youtube.apiKey) missing.push('YOUTUBE_API_KEY');
  if (missing.length > 0) {
    console.warn(`[config] Warning: missing keys: ${missing.join(', ')} — some features will be limited.`);
  }
}
