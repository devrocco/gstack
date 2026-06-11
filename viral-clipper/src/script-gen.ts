import type { ClipCandidate, ScriptIdea, AssetType } from './types.js';

// ── Category detection ───────────────────────────────────────────────────────

type ContentCategory = 'worldcup' | 'wonderkid' | 'viral' | 'reaction' | 'story';

const CATEGORY_PATTERNS: Record<ContentCategory, RegExp> = {
  worldcup:  /world cup|fifa 2026|wc2026|world cup final|group stage|knockout/i,
  wonderkid: /wonderkid|prodigy|young talent|rising star|next superstar|u21|u-21|youth|academy|teenage/i,
  reaction:  /reaction|react|fan|crowd|atmosphere|stadium|supporters|fans go wild/i,
  story:     /story|journey|from nothing|underdog|biography|grew up|childhood|road to|dream/i,
  viral:     /skill|trick|insane|unbelievable|incredible|amazing|nutmeg|rabona|volley|bicycle kick|fail/i,
};

// Priority order: specific categories first, worldcup is the fallback
const CATEGORY_PRIORITY: ContentCategory[] = ['wonderkid', 'reaction', 'story', 'viral', 'worldcup'];

function detectCategory(title: string): ContentCategory {
  for (const cat of CATEGORY_PRIORITY) {
    if (CATEGORY_PATTERNS[cat].test(title)) return cat;
  }
  return 'worldcup';
}

// ── Category configs ─────────────────────────────────────────────────────────

interface CategoryConfig {
  emoji: string;
  titleSuffix: string;
  cta: string;
  hashtags: string[];
}

const CATEGORY_CONFIGS: Record<ContentCategory, CategoryConfig> = {
  worldcup: {
    emoji: '🏆',
    titleSuffix: 'FIFA World Cup 2026',
    cta: "The best moments from the World Cup 2026 — don't miss a second! ⚽🔥",
    hashtags: ['#FIFA2026', '#WorldCup2026', '#WorldCup', '#FIFA', '#Qatar2026',
      '#Football', '#Soccer', '#Shorts', '#FIFAWorldCup'],
  },
  wonderkid: {
    emoji: '⭐',
    titleSuffix: 'Next Football Superstar?',
    cta: "Meet the next big thing in football 🌟 These wonderkids are going to change the game!",
    hashtags: ['#Wonderkid', '#FootballProdigy', '#NextGeneration', '#YoungTalent',
      '#FutureStars', '#Football', '#Soccer', '#Shorts', '#FIFA2026'],
  },
  viral: {
    emoji: '🔥',
    titleSuffix: 'UNBELIEVABLE Football Moment',
    cta: "You won't believe this happened in real life 😱⚽ Drop a 🔥 if this blew your mind!",
    hashtags: ['#ViralFootball', '#FootballSkills', '#CrazyFootball', '#FootballMoments',
      '#UnbelievableFootball', '#Football', '#Soccer', '#Shorts', '#Reels'],
  },
  reaction: {
    emoji: '😱',
    titleSuffix: 'Crowd Reaction',
    cta: "This is what football is all about — pure emotion! 💙❤️ Share if this gave you chills!",
    hashtags: ['#FootballReaction', '#FanReaction', '#FootballAtmosphere', '#CrowdReaction',
      '#FootballFans', '#WorldCup2026', '#Football', '#Soccer', '#Shorts'],
  },
  story: {
    emoji: '💪',
    titleSuffix: 'Incredible Football Story',
    cta: "This story will give you goosebumps 💪 Football is more than a game.",
    hashtags: ['#FootballStory', '#FootballMotivation', '#FootballLife', '#Underdog',
      '#FootballJourney', '#Football', '#Soccer', '#Shorts', '#Inspiration'],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function pickEmoji(category: ContentCategory, title: string): string {
  if (/goal|score|scored/i.test(title)) return '⚽';
  if (/save|keeper|goalkeeper/i.test(title)) return '🧤';
  if (/red card/i.test(title)) return '🟥';
  if (/trophy|champion|winner/i.test(title)) return '🏆';
  return CATEGORY_CONFIGS[category].emoji;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 75);
}

function addPlayerHashtags(title: string, tags: string[]): string[] {
  const extra: string[] = [];
  if (/messi/i.test(title)) extra.push('#Messi');
  if (/ronaldo/i.test(title)) extra.push('#Ronaldo');
  if (/mbapp/i.test(title)) extra.push('#Mbappe');
  if (/haaland/i.test(title)) extra.push('#Haaland');
  if (/vinicius|vini/i.test(title)) extra.push('#Vinicius');
  if (/bellingham/i.test(title)) extra.push('#Bellingham');
  if (/argentina/i.test(title)) extra.push('#Argentina');
  if (/brazil/i.test(title)) extra.push('#Brazil');
  if (/france/i.test(title)) extra.push('#France');
  if (/england/i.test(title)) extra.push('#England');
  if (/spain/i.test(title)) extra.push('#Spain');
  if (/germany/i.test(title)) extra.push('#Germany');
  if (/portugal/i.test(title)) extra.push('#Portugal');
  if (/usa|united states/i.test(title)) extra.push('#USMNT');
  const combined = [...tags, ...extra];
  // Deduplicate preserving order
  return [...new Set(combined)].slice(0, 15);
}

function safeAssetsFor(c: ClipCandidate): AssetType[] {
  if (c.sourceType === 'licensed' || c.sourceType === 'user_owned') {
    return ['licensed_footage', 'caption', 'voiceover', 'stats_card'];
  }
  return ['voiceover', 'caption', 'graphic', 'stats_card'];
}

// ── Main export ──────────────────────────────────────────────────────────────

export function generateScript(c: ClipCandidate): ScriptIdea {
  const category = detectCategory(c.title);
  const cfg = CATEGORY_CONFIGS[category];
  const emoji = pickEmoji(category, c.title);
  const cleaned = cleanTitle(c.title);
  const hashtags = addPlayerHashtags(c.title, cfg.hashtags);

  const title = `${emoji} ${cleaned} - ${cfg.titleSuffix} #Shorts`.slice(0, 100);

  const description = [
    `${emoji} ${cleaned}`,
    '',
    cfg.cta,
    '',
    hashtags.join(' '),
    '',
    `Source: ${c.url}`,
  ].join('\n');

  return {
    title,
    description: description.slice(0, 5000),
    hashtags,
    assetsNeeded: safeAssetsFor(c),
  };
}
