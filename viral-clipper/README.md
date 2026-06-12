# viral-clipper

Scout viral football moments → generate 60-second Shorts/Reels via [Vugola AI](https://vugolaai.com) → publish to YouTube, Instagram, and TikTok. Built for the FIFA World Cup 2026, designed to keep running after it (just change the keywords).

## How it works

```
Scout → Score → Compliance → Script Gen → [Human Review] → Vugola Job → [Human Approve] → Publish
```

- **Scout** — Reddit (r/soccer, r/worldcup, r/football, r/sports, r/footballhighlights) + YouTube search. Metadata and URLs only; nothing is downloaded.
- **Score** — virality 0–100 from upvotes/views with recency decay.
- **Compliance** — copyright risk gate. Official broadcasts and unknown sources are blocked. In the default `metadata_only` mode, only `licensed`/`user_owned` sources pass.
- **Script Gen** — auto-detects which of 5 content categories a clip belongs to and generates a matching title, CTA, and hashtag set.
- **Vugola** — handles clip creation and multi-platform publishing via your connected accounts.
- **Publishing is always manual.** The scheduler creates drafts only. `approve` then `publish` are explicit CLI steps.

## Content categories

Optimized for discoverability across five pillars (auto-detected per clip):

| Category | Trigger words | Hashtags |
|---|---|---|
| World Cup 2026 | world cup, fifa 2026, knockout | #FIFA2026 #WorldCup2026 |
| Wonderkids | wonderkid, prodigy, young talent | #Wonderkid #FootballProdigy |
| Viral moments | skill, nutmeg, rabona, insane | #ViralFootball #FootballSkills |
| Match reactions | reaction, crowd, stadium | #FanReaction #CrowdReaction |
| Football stories | journey, underdog, story | #FootballStory #FootballMotivation |

## Setup

1. **Vugola** — sign up at [vugolaai.com](https://vugolaai.com), connect your YouTube/Instagram/TikTok accounts in their dashboard, copy your API key.
2. **YouTube Data API** — [console.cloud.google.com](https://console.cloud.google.com) → enable "YouTube Data API v3" → Credentials → API key. (Free; used for search only.)
3. **Reddit (recommended)** — [reddit.com/prefs/apps](https://reddit.com/prefs/apps) → create a "script" app → copy client ID + secret. Without this, Reddit may return 403 from datacenter IPs.

```bash
bun install
cp .env.example .env   # fill in keys
```

## Usage

```bash
bun src/index.ts run              # dry-run: scout + score + compliance, nothing sent
bun src/index.ts run --draft      # create draft clips in Vugola
bun src/index.ts status           # recent jobs + audit log
bun src/index.ts approve <jobId>  # human-approve a draft
bun src/index.ts publish <jobId>  # publish an approved draft
bun src/index.ts schedule         # continuous scouting every 30 min (drafts only)
bun src/index.ts accounts         # list connected social accounts
```

## Safety model

| Setting | Default | Meaning |
|---|---|---|
| `LICENSE_MODE` | `metadata_only` | No video is downloaded or transformed; only licensed/user-owned sources pass compliance |
| `SAFE_ASSET_MODE` | `true` | Clips built from voiceover, captions, graphics, stats cards — not match footage |
| `REVIEW_REQUIRED` | `true` | Candidates need interactive y/n approval before any Vugola job |
| `ENABLE_AUTO_PUBLISH` | `false` | `run --publish` is inert until you flip this |
| Platforms | YouTube only | Instagram/TikTok/Facebook off until you enable them |

Every decision (blocked, submitted, approved, rejected) is written to an audit log in `~/.viral-clipper/store.db`. API keys are never logged or stored.

## After the World Cup

Edit `KEYWORDS` in `.env` — that's it. Champions League, Premier League, NBA, anything. The pipeline is event-agnostic; the category detection and hashtag sets are the only football-specific parts (`src/script-gen.ts` if you want to retheme them).

## Tests

```bash
bun test   # 31 unit tests: scoring, compliance gate, script gen, store
```
