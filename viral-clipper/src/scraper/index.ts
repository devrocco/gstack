import { scrapeReddit } from './reddit.js';
import { scrapeYouTube } from './youtube.js';
import { config } from '../config.js';
import type { ClipCandidate } from '../types.js';

export async function scoutContent(): Promise<ClipCandidate[]> {
  const keywords = config.pipeline.keywords;
  console.log(`[scout] Scouting with ${keywords.length} keywords: ${keywords.slice(0, 2).join(', ')}${keywords.length > 2 ? '...' : ''}`);

  const [redditResults, youtubeResults] = await Promise.all([
    scrapeReddit(keywords),
    scrapeYouTube(keywords),
  ]);

  const all = [...redditResults, ...youtubeResults];
  console.log(`[scout] Found ${redditResults.length} Reddit + ${youtubeResults.length} YouTube candidates`);

  // Deduplicate by URL
  const seen = new Set<string>();
  return all.filter(c => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}
