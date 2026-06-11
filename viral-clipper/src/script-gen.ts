import type { ClipCandidate, ScriptIdea, AssetType } from './types.js';

const BASE_HASHTAGS = ['#FIFA2026', '#WorldCup', '#Soccer', '#Football', '#Shorts'];

const FIFA_EMOJIS = ['🔥', '⚽', '🏆', '💥', '🎯', '👏'];

function pickEmoji(title: string): string {
  if (/goal|score|scored/i.test(title)) return '⚽';
  if (/save|keeper|goalkeeper/i.test(title)) return '🧤';
  if (/red card|foul|tackle/i.test(title)) return '🟥';
  if (/champion|trophy|win/i.test(title)) return '🏆';
  return FIFA_EMOJIS[Math.floor(Math.random() * FIFA_EMOJIS.length)];
}

function cleanTitle(raw: string): string {
  // Remove common Reddit noise
  return raw
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function extractKeyTerms(title: string): string[] {
  const terms: string[] = [];
  const matches = title.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) ?? [];
  return [...terms, ...matches].slice(0, 3);
}

function buildHashtags(c: ClipCandidate, extra: string[]): string[] {
  const tags = [...BASE_HASHTAGS];
  if (/argentina/i.test(c.title)) tags.push('#Argentina');
  if (/brazil/i.test(c.title)) tags.push('#Brazil');
  if (/france/i.test(c.title)) tags.push('#France');
  if (/england/i.test(c.title)) tags.push('#England');
  if (/spain/i.test(c.title)) tags.push('#Spain');
  if (/germany/i.test(c.title)) tags.push('#Germany');
  if (/messi/i.test(c.title)) tags.push('#Messi');
  if (/ronaldo/i.test(c.title)) tags.push('#Ronaldo');
  if (/mbapp/i.test(c.title)) tags.push('#Mbappe');
  for (const term of extra) {
    const tag = '#' + term.replace(/\s+/g, '');
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, 12);
}

function safeAssetsFor(c: ClipCandidate): AssetType[] {
  // In safe_asset_mode we only use non-footage assets unless source is licensed
  if (c.sourceType === 'licensed' || c.sourceType === 'user_owned') {
    return ['licensed_footage', 'caption', 'voiceover', 'stats_card'];
  }
  return ['voiceover', 'caption', 'graphic', 'stats_card'];
}

export function generateScript(c: ClipCandidate): ScriptIdea {
  const emoji = pickEmoji(c.title);
  const cleanedTitle = cleanTitle(c.title);
  const terms = extractKeyTerms(c.title);
  const hashtags = buildHashtags(c, terms);

  const shortTitle = `${emoji} ${cleanedTitle} - FIFA World Cup 2026 #Shorts`;
  const description = [
    `${emoji} ${cleanedTitle}`,
    '',
    `Don't miss this viral moment from the FIFA World Cup 2026!`,
    '',
    hashtags.join(' '),
    '',
    `Source: ${c.url}`,
  ].join('\n');

  return {
    title: shortTitle.slice(0, 100),
    description: description.slice(0, 5000),
    hashtags,
    assetsNeeded: safeAssetsFor(c),
  };
}
