import { describe, test, expect } from 'bun:test';
import { generateScript } from '../src/script-gen.js';
import type { ClipCandidate } from '../src/types.js';

function makeCandidate(title: string, overrides: Partial<ClipCandidate> = {}): ClipCandidate {
  return {
    id: 'test-id',
    url: 'https://example.com/clip',
    title,
    source: 'reddit',
    sourceType: 'ugc',
    viralityScore: 80,
    copyrightRiskScore: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('generateScript — category detection', () => {
  test('worldcup category for generic WC titles', () => {
    const s = generateScript(makeCandidate('Argentina vs France World Cup 2026 final'));
    expect(s.hashtags).toContain('#FIFA2026');
    expect(s.hashtags).toContain('#WorldCup2026');
  });

  test('wonderkid category takes priority over worldcup', () => {
    const s = generateScript(makeCandidate('17-year-old wonderkid scores on World Cup debut'));
    expect(s.hashtags).toContain('#Wonderkid');
    expect(s.title).toContain('Next Football Superstar');
  });

  test('reaction category detected', () => {
    const s = generateScript(makeCandidate('Stadium reaction when USA scored'));
    expect(s.hashtags).toContain('#FanReaction');
  });

  test('story category detected', () => {
    const s = generateScript(makeCandidate('Mbappe journey from nothing to superstar'));
    expect(s.hashtags).toContain('#FootballStory');
  });

  test('viral category detected', () => {
    const s = generateScript(makeCandidate('Insane rabona trick shot nutmeg'));
    expect(s.hashtags).toContain('#ViralFootball');
  });
});

describe('generateScript — output constraints', () => {
  test('title stays within 100 chars even for long input', () => {
    const s = generateScript(makeCandidate('A'.repeat(300)));
    expect(s.title.length).toBeLessThanOrEqual(100);
  });

  test('all titles include #Shorts', () => {
    const s = generateScript(makeCandidate('Great goal'));
    expect(s.title).toContain('#Shorts');
  });

  test('player hashtags auto-added', () => {
    const s = generateScript(makeCandidate('Messi scores incredible goal for Argentina'));
    expect(s.hashtags).toContain('#Messi');
    expect(s.hashtags).toContain('#Argentina');
  });

  test('hashtags are deduplicated', () => {
    const s = generateScript(makeCandidate('World Cup goal'));
    expect(new Set(s.hashtags).size).toBe(s.hashtags.length);
  });

  test('description includes source attribution', () => {
    const s = generateScript(makeCandidate('Great goal', { url: 'https://reddit.com/r/soccer/xyz' }));
    expect(s.description).toContain('https://reddit.com/r/soccer/xyz');
  });

  test('ugc sources only get safe assets (no footage)', () => {
    const s = generateScript(makeCandidate('Great goal', { sourceType: 'ugc' }));
    expect(s.assetsNeeded).not.toContain('licensed_footage');
    expect(s.assetsNeeded).toContain('voiceover');
  });

  test('licensed sources may use footage', () => {
    const s = generateScript(makeCandidate('Great goal', { sourceType: 'licensed' }));
    expect(s.assetsNeeded).toContain('licensed_footage');
  });
});
