import { randomUUID } from 'crypto';
import { config } from '../config.js';
import type { ClipCandidate } from '../types.js';

const VIDEO_DOMAINS = ['v.redd.it', 'youtu.be', 'youtube.com', 'streamable.com', 'clips.twitch.tv'];

interface RedditPost {
  id: string;
  title: string;
  url: string;
  is_video: boolean;
  score: number;
  created_utc: number;
  media?: { reddit_video?: { duration?: number } };
  thumbnail?: string;
  domain?: string;
}

let _redditToken: { token: string; expiresAt: number } | null = null;

async function getRedditToken(): Promise<string | null> {
  const { clientId, clientSecret } = config.reddit;
  if (!clientId || !clientSecret) return null;
  if (_redditToken && Date.now() < _redditToken.expiresAt - 60_000) return _redditToken.token;

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'User-Agent': 'viral-clipper/1.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) return null;
  const json = await res.json() as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  _redditToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return _redditToken.token;
}

async function fetchSubreddit(subreddit: string): Promise<RedditPost[]> {
  const token = await getRedditToken();
  const headers: Record<string, string> = {
    'User-Agent': 'viral-clipper/1.0 (sports content scouting; contact: clouddigitalaccess@outlook.com)',
    'Accept': 'application/json',
  };
  const baseUrl = token
    ? 'https://oauth.reddit.com'
    : 'https://www.reddit.com';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}/r/${subreddit}/hot.json?limit=50`, { headers });
  if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
      console.warn(`[reddit] r/${subreddit} returned ${res.status} — add REDDIT_CLIENT_ID/SECRET to .env for authenticated access`);
    } else {
      console.warn(`[reddit] r/${subreddit} returned ${res.status} — skipping`);
    }
    return [];
  }
  const json = await res.json() as { data?: { children?: Array<{ data: RedditPost }> } };
  return json.data?.children?.map(c => c.data) ?? [];
}

function isVideoPost(post: RedditPost): boolean {
  if (post.is_video) return true;
  if (!post.url) return false;
  try {
    const host = new URL(post.url).hostname;
    return VIDEO_DOMAINS.some(d => host.includes(d));
  } catch {
    return false;
  }
}

function matchesKeywords(title: string, keywords: string[]): boolean {
  const lower = title.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

export async function scrapeReddit(keywords: string[]): Promise<ClipCandidate[]> {
  const candidates: ClipCandidate[] = [];

  for (const sub of config.reddit.subreddits) {
    let posts: RedditPost[];
    try {
      posts = await fetchSubreddit(sub);
    } catch (err) {
      console.warn(`[reddit] Failed to fetch r/${sub}: ${(err as Error).message}`);
      continue;
    }

    for (const post of posts) {
      if (post.score < config.reddit.minUpvotes) continue;
      if (!isVideoPost(post)) continue;
      if (!matchesKeywords(post.title, keywords)) continue;

      candidates.push({
        id: randomUUID(),
        url: post.url,
        title: post.title,
        source: 'reddit',
        sourceType: 'ugc',
        viralityScore: 0,
        copyrightRiskScore: 0,
        upvotes: post.score,
        duration: post.media?.reddit_video?.duration,
        thumbnail: post.thumbnail?.startsWith('http') ? post.thumbnail : undefined,
        createdAt: new Date(post.created_utc * 1000),
      });
    }

    // Respect rate limits between subreddit fetches
    await new Promise(r => setTimeout(r, 500));
  }

  return candidates;
}
