import { randomUUID } from 'crypto';
import { config } from '../config.js';
import type { ClipCandidate, SourceType } from '../types.js';

const OFFICIAL_CHANNEL_KEYWORDS = ['fifa', 'uefa', 'fcbarcelona', 'realmadrid', 'manchesterunited',
  'manchestercity', 'liverpool', 'arsenal', 'chelsea', 'tottenham', 'juventus', 'acmilan',
  'internazionale', 'atletico', 'bayernmunich', 'psg', 'laliga', 'premierleague', 'seriea'];
const NEWS_CHANNEL_KEYWORDS = ['espn', 'bbc', 'skysports', 'beinsports', 'goal', 'talkingfoot'];

function classifySourceType(channelTitle: string): SourceType {
  const lower = channelTitle.toLowerCase().replace(/\s+/g, '');
  if (OFFICIAL_CHANNEL_KEYWORDS.some(k => lower.includes(k))) return 'official';
  if (NEWS_CHANNEL_KEYWORDS.some(k => lower.includes(k))) return 'news';
  return 'ugc';
}

function iso8601DurationToSeconds(dur: string): number {
  const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] ?? '0') * 3600) +
    (parseInt(match[2] ?? '0') * 60) +
    parseInt(match[3] ?? '0');
}

interface YTSearchItem {
  id: { videoId: string };
  snippet: {
    title: string; publishedAt: string;
    channelTitle: string; thumbnails: { default?: { url: string } };
  };
}

interface YTVideoItem {
  id: string;
  contentDetails: { duration: string };
  statistics: { viewCount?: string };
}

export async function scrapeYouTube(keywords: string[]): Promise<ClipCandidate[]> {
  if (!config.youtube.apiKey) {
    console.warn('[youtube] YOUTUBE_API_KEY not set — skipping YouTube scraping');
    return [];
  }

  const candidates: ClipCandidate[] = [];
  const videoIds: string[] = [];
  const snippetMap = new Map<string, YTSearchItem['snippet'] & { channelTitle: string }>();

  // Always inject category anchors so all 5 content pillars get coverage
  // even if user's custom keywords only mention one category
  const categoryAnchors = [
    'World Cup 2026 highlights',
    'football wonderkid 2026',
    'viral football reaction',
  ];
  const allKeywords = [...new Set([...keywords, ...categoryAnchors])];

  for (const keyword of allKeywords.slice(0, 6)) {
    const params = new URLSearchParams({
      part: 'snippet',
      q: keyword,
      type: 'video',
      videoDuration: 'short',
      order: 'viewCount',
      maxResults: '10',
      key: config.youtube.apiKey,
    });

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (!res.ok) {
        console.warn(`[youtube] Search API returned ${res.status} for "${keyword}"`);
        continue;
      }
      const json = await res.json() as { items?: YTSearchItem[] };
      for (const item of json.items ?? []) {
        videoIds.push(item.id.videoId);
        snippetMap.set(item.id.videoId, item.snippet);
      }
    } catch (err) {
      console.warn(`[youtube] Search failed for "${keyword}": ${(err as Error).message}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  if (videoIds.length === 0) return [];

  // Fetch duration + stats in one batch
  const detailParams = new URLSearchParams({
    part: 'contentDetails,statistics',
    id: videoIds.join(','),
    key: config.youtube.apiKey,
  });
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailParams}`);
    if (res.ok) {
      const json = await res.json() as { items?: YTVideoItem[] };
      for (const item of json.items ?? []) {
        const snippet = snippetMap.get(item.id);
        if (!snippet) continue;
        const duration = iso8601DurationToSeconds(item.contentDetails.duration);
        const views = parseInt(item.statistics.viewCount ?? '0', 10);
        candidates.push({
          id: randomUUID(),
          url: `https://www.youtube.com/watch?v=${item.id}`,
          title: snippet.title,
          source: 'youtube',
          sourceType: classifySourceType(snippet.channelTitle),
          viralityScore: 0,
          copyrightRiskScore: 0,
          views,
          duration,
          thumbnail: snippet.thumbnails?.default?.url,
          createdAt: new Date(snippet.publishedAt),
        });
      }
    }
  } catch (err) {
    console.warn(`[youtube] Video details fetch failed: ${(err as Error).message}`);
  }

  return candidates;
}
