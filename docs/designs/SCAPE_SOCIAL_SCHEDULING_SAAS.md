# SCAPE — Social Media Scheduling SaaS

**Status:** Design  
**Date:** 2026-06-12  
**Domain:** `scape.studio`  
**Tagline:** *"Schedule like you mean it."*

---

## Why This Exists

Buffer, Hootsuite, and Later are reactive. You open a calendar, type a caption, pick a time, click Schedule. The tools wait for you. They present data in the blandest possible format. Their UIs look like enterprise project management software built in 2019.

SCAPE is a **Trading Terminal for Content**. Dense, proactive, cinematic. It watches your niche, surfaces what's actually breaking through (outliers, not averages), and proposes the post before you open the tab. The UI signals technical competence — 1px borders, glass effects, JetBrains Mono for all data — rather than "bubbly consumer SaaS."

The signature feature is the **Morphing Composer**: when you switch from YouTube to TikTok, the form physically transforms with spring animations. The thumbnail zone for YouTube slides in. The phone frame for TikTok rises from the bottom. The aspect ratio switcher for Instagram morphs the upload zone's actual shape. It *feels* like the tool understands what each platform needs.

The moat is taste. There's no patent on a scheduler. The only protection is an experience so good that switching feels like downgrading.

---

## Identity

| Field | Value |
|-------|-------|
| Name | SCAPE |
| Domain | scape.studio |
| Tagline | "Schedule like you mean it." |
| Aesthetic | Trading Terminal for Content |
| Target | Video creators, AI-niche builders, indie brand operators |

**Why SCAPE:** Short, ambiguous-in-the-right-way. "Escape" from mediocrity of existing tools. "Landscape" of your content. Single syllable, no trailing vowel — editorial and fast. Works as verb and noun.

---

## Design System

### The Mandate

Reject white space minimalism. This is a **Bento Command Center** — every tile is a live data point or predictive action. Density over whitespace. 1px borders and glass effects signal craft, not consumer-grade design.

**Key aesthetic decisions:**
- SVG `feTurbulence` grain at 2.5% opacity on body — removes "flat React app" feel
- `backdrop-blur-sm` + `bg-white/[0.04]` + `border border-white/[0.08]` = glass recipe
- Spring physics for all animations — duration-based tweens feel web-ish and cheap
- No light mode at launch — dark mode only

### Color Palette

```
Background base:    #080808   — near-absolute black (not pure #000)
Surface-01:         #0F0F0F   — card backgrounds
Surface-02:         #161616   — elevated cards, dropdowns
Surface-03:         #1E1E1E   — hover states
Border subtle:      #242424   — dividers, 1px borders
Border strong:      #333333   — focused/active states

Text-primary:       #F5F5F5
Text-secondary:     #888888
Text-tertiary:      #555555

Accent-primary:     #C8FF00   — electric chartreuse (13:1 contrast on #080808, WCAG AAA)
Accent-warm:        #FF6B35   — errors, warnings
Accent-blue:        #4A9EFF   — info, links

Platform brand colors (exact):
  YouTube:    #FF0000
  TikTok:     #69C9D0 / #EE1D52  (duotone)
  Instagram:  gradient #E1306C → #F77737 → #FCAF45
  X:          #FFFFFF
  LinkedIn:   #0A66C2
  Facebook:   #1877F2

Semantic:
  Success:  #22C55E
  Error:    #EF4444
  Warning:  #F59E0B
  Info:     #3B82F6
```

**Why chartreuse (#C8FF00):** 2026's most culturally loaded accent — present in luxury streetwear, high-end editorial, creative agency sites. On #080808 it reads "designed by someone with taste." 13:1 contrast ratio exceeds WCAG AAA.

### Typography

| Role | Font | Source | Notes |
|------|------|--------|-------|
| Display | **Clash Display** | Fontshare CDN | Hero text, platform names, big numbers |
| UI Body | **Inter Variable** | Bunny CDN (GDPR-safe) | All labels, body copy |
| Monospace | **JetBrains Mono** | Google Fonts | Timestamps, counters, API data, tabular numbers |

Do not use Inter for display. No Roboto. No system-ui for anything user-facing. Clash Display at large sizes with negative tracking (`-0.03em` to `-0.04em`) is the visual signature.

### Type Scale

```
Display-2xl:  72px / lh 1.0  / tr -0.04em  — hero
Display-xl:   56px / lh 1.05 / tr -0.03em  — page titles
Display-lg:   40px / lh 1.1  / tr -0.02em  — section headers
Heading-xl:   28px / lh 1.2  / tr -0.015em
Heading-lg:   22px / lh 1.3  / tr -0.01em
Body-lg:      16px / lh 1.6
Body-md:      14px / lh 1.5
Label:        12px / lh 1.4  / tr 0.02em / UPPERCASE — platform badges
Mono:         13px / lh 1.4  / JetBrains Mono — timestamps, counts
```

### Motion Principles

Spring physics everywhere. Duration-based tweens feel web-ish and cheap.

```ts
Spring-snappy:  { stiffness: 400, damping: 28, mass: 0.8 }  // quick UI feedback
Spring-smooth:  { stiffness: 200, damping: 20, mass: 1 }    // platform morph
Spring-bouncy:  { stiffness: 600, damping: 22, mass: 0.6 }  // success states
Spring-heavy:   { stiffness: 120, damping: 18, mass: 1.2 }  // modal entrance
```

---

## Core Screens

### 1. Marketing Landing (`/`)

Full-bleed looping video of the morphing composer in action (muted, autoplay). "Schedule like you mean it." in Clash Display 72px. One CTA: "Start for free." Social proof: creator headshots + subscriber counts they manage. An interactive live demo of the composer (no account required) embedded below the fold. No navbar links. No feature grid. No pricing table above the fold.

Key UX moment: Within 3 seconds, visitors see the composer morph between platforms. That *is* the pitch.

### 2. Auth (`/auth`)

Magic link only. No passwords. Single email input, full-screen dark treatment. "Enter your email. We'll send a link." On first sign-in: workspace creation form (name + first platform connection).

### 3. Bento Command Center (Dashboard, `/home`)

Not a list. Not a calendar preview. A live command center with dense tiles:

```
┌───────────────────────────────────────────────────────────────────┐
│  [SCAPE]  [workspace switcher ▾]                   [+ New Post]  │
├──────┬────────────────────────────────┬─────────────────────────── │
│      │  NEXT UP                       │  QUEUE PULSE               │
│  Nav │  [Post card]  [Post card]      │  24 scheduled              │
│      │  [Post card]  [Post card]      │  6 FAILED ◀ loud, red      │
│      ├────────────────────────────────┤  ────────────────          │
│      │  THIS WEEK                     │  PLATFORM STATUS           │
│      │  [Calendar week strip]         │  ● YT  ● TK  ● IG         │
│      │                                │  ● X   ● LI  ● FB         │
│      ├────────────────────────────────┤  ────────────────          │
│      │  OUTLIER SIGNAL (Phase 2)      │  STREAK                    │
│      │  [Trend card]  [Trend card]    │  14 days posting           │
│      │  + human provenance shown      │  ────────────────          │
│      │                                │  STORAGE 18.4GB / 50GB     │
└──────┴────────────────────────────────┴────────────────────────────┘
```

**Failed posts are loud by design.** `#EF4444` bordered tile, explicit count, one-click "Retry all." Not a muted badge. Failure visibility is a first-class product decision — the #1 reason creators leave scheduling tools is a post that silently failed.

First-load empty state: full-bleed dark prompt — "Your first post is one keystroke away. Hit Space." No placeholder graphics.

### 4. The Morphing Composer (`/compose` or modal)

See dedicated section below — this is the entire product thesis.

### 5. Calendar (`/calendar`)

Month view default. Posts are color-coded stacked cards per platform (platform brand colors). Hover a day — it "blooms" open. Drag cards between days with spring-bounce drop. Phase 2: ghost slots for "best time to post" based on historical engagement.

### 6. Queue (`/queue`)

Feed view, platform-filterable by icon toggles (no text labels, just colored platform logos). Failed posts: `#EF4444` left border + inline "Retry" button. Bulk select bar appears on checkbox selection (delete / reschedule / duplicate). Posts ordered by scheduled time.

### 7. Connected Accounts (`/settings/accounts`)

Platform cards with brand-color left borders. Token expiry warnings appear as amber text ("Instagram token expires in 3 days"). Connect/disconnect buttons. Clear visual state for each platform: connected (green dot), warning (amber), disconnected (muted).

### 8. Settings + Billing (`/settings`)

Workspace name, timezone, slug. Team members (Team tier). Stripe Customer Portal for billing.

---

## The Morphing Composer

The signature feature. The entire reason someone switches from Buffer.

### Structure

Full-height right panel (40% screen desktop, fullscreen mobile). Two zones:
- **Left / Input Canvas** — write, upload, configure
- **Right / Platform Preview** — live render of what the post looks like on that specific platform

### Platform Selector

Six platform logos as pill buttons at the top. Multiple can be selected (cross-posting). Click a single platform → the entire Input Canvas physically transforms.

### Per-Platform Transformations

**YouTube:**
- Thumbnail zone slides DOWN as hero of the form (16:9 drag-drop zone, prominently placed)
- Title field is large (100 char, video titles matter)
- Description (5000 char, collapsible)
- Tags as chip input
- Visibility: Public / Unlisted / Private
- Preview: YouTube card with thumbnail, title, channel name, simulated view count "•••"

**TikTok:**
- Input narrows to portrait-friendly layout
- Phone frame preview RISES UP from bottom (Spring-bouncy)
- Sound picker field appears
- Privacy: Everyone / Friends / Only Me
- Allow Duets / Stitches toggles
- Preview: iPhone-style frame with TikTok UI overlay (heart/comment/share buttons, hashtags below)

**Instagram:**
- Aspect ratio switcher [1:1] [4:5] [9:16] — visual toggles that animate the upload zone's actual shape
- Caption (2200 char), hashtag suggestions
- Alt text (expandable)
- Location picker
- First Comment field (for hashtag hiding strategy)
- Preview: Instagram card OR Stories/Reels UI if 9:16 selected

**X (Twitter):**
- Compact conversational layout
- Character counter: circular SVG arc that depletes as you type (turns red at ~260)
- Thread builder: "+ Tweet" button adds card below, slides in with Spring-snappy
- Max 280 per tweet, up to 25 in thread
- Preview: Tweet card with avatar, handle, timestamp, engagement buttons

**LinkedIn:**
- Spacious, formal layout
- Post text (3000 char)
- Document upload renders as stack of page thumbnails
- Poll creator
- Post as: Personal / Company Page toggle
- Preview: LinkedIn feed card with "…see more" truncation

**Facebook:**
- Post text (63206 char, but de-emphasized)
- Photo/Video upload
- Feeling picker
- Preview: Facebook post card

### The Morph Animation — Technical Specification

When the user clicks a different platform:

1. **Phase 1 (0–120ms):** Current platform's unique fields fade out (`opacity: 0, y: -8`). Spring-snappy.
2. **Phase 2 (80–200ms):** Canvas container height breathes to new value. Framer Motion `layout` prop handles measurement automatically.
3. **Phase 3 (120–320ms):** New platform's unique fields fade in staggered at 40ms intervals.
4. **Throughout:** Shared fields (date/time picker, media upload zone) stay put. The form *adapts*, not replaces.

```tsx
// The critical technique
<AnimatePresence mode="popLayout">  // NOT mode="wait" — concurrent exit+enter
  {platformFields.map((field, i) => (
    <motion.div
      key={`${selectedPlatform}-${field.id}`}
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: i * 0.04  // stagger per field
      }}
    >
      {field.component}
    </motion.div>
  ))}
</AnimatePresence>
```

`mode="popLayout"` removes exiting elements from layout flow immediately. New elements enter concurrently. The morph feels instant and physical, not sequential.

Wrap the entire composer in a `LayoutGroup` for shared layout animations across platform state changes.

### Cross-posting Mode

Multiple platforms selected → Input Canvas shows union of all fields with platform badge indicators on each field. Preview pane shows tabs for each selected platform — click to preview how it'll look on each. Platform-specific overrides let you tweak captions per platform without re-entering shared content.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 15 App Router** | RSC for zero-spinner views; Parallel Routes for composer modal; Turbopack dev |
| Auth + DB | **Supabase** | Magic link auth; Realtime for post status push; RLS workspace isolation |
| Media storage | **Cloudflare R2** | Zero egress fees (critical for video at scale); TUS resumable uploads |
| Video pipeline | **Mux** | Best-in-class player SDK; auto thumbnail generation; stable `playback_id` |
| Background jobs | **Upstash QStash** | Serverless HTTP queue; delay scheduling native; automatic exponential backoff |
| Payments | **Stripe** | Customer Portal for self-serve; standard webhooks |
| UI components | **Shadcn** (heavily modified) | Radix UI accessibility primitives; visual layer fully owned by Tailwind |
| Animations | **Framer Motion** | Spring physics; `layout` prop; `AnimatePresence`; nothing else handles morphing as well |
| State | **Zustand** | Flat store prevents re-render cascades that would jank composer animations |
| Data fetching | **TanStack Query** | Optimistic mutations + rollback for calendar drag; better devtools than SWR |
| Schema validation | **Zod** | All platform payloads and API responses validated at runtime |
| Package manager | **pnpm** | Fast, strict, no phantom deps |
| Deploy | **Vercel** | Zero-config Next.js; edge middleware for auth |

### Key Decisions

**Why not tRPC?** Server Actions give type-safe mutations without schema overhead. tRPC is Phase 3 when an external API is built.

**Why not BullMQ?** Requires persistent Redis infra. QStash is serverless and purpose-built for "deliver this HTTP request at T+delay."

**Why Mux over Cloudflare Stream?** Better DX, cleaner thumbnail API, stable playback IDs. Developer time costs more than the $20/month price difference.

**Why Zustand not Context?** The composer has complex cross-cutting state (selected platforms, per-platform field values, media assets, scheduling time). Context with useState causes full tree re-renders on every keystroke — visible jank in animations.

---

## Spec-Driven Development: Zod Contracts

Every platform payload, every API response is typed and validated. Social platform APIs break constantly. Without contracts, failures are silent.

```ts
// lib/schemas/platform.ts — source of truth
import { z } from "zod"

export const YouTubePayloadSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).max(500).optional(),
  visibility: z.enum(["public", "unlisted", "private"]),
  thumbnail_asset_id: z.string().uuid().optional(),
})

export const TikTokPayloadSchema = z.object({
  caption: z.string().max(2200),
  privacy: z.enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"]),
  allow_duets: z.boolean().default(true),
  allow_stitches: z.boolean().default(true),
  sound_id: z.string().optional(),
})

export const InstagramPayloadSchema = z.object({
  caption: z.string().max(2200).optional(),
  aspect_ratio: z.enum(["1:1", "4:5", "9:16"]),
  location_id: z.string().optional(),
  first_comment: z.string().max(2200).optional(),
  alt_text: z.string().max(100).optional(),
})

export const XPayloadSchema = z.object({
  thread: z.array(z.object({
    text: z.string().max(280),
    media_ids: z.array(z.string()).max(4).optional(),
  })).min(1).max(25),
})

export const LinkedInPayloadSchema = z.object({
  text: z.string().max(3000),
  post_as: z.enum(["personal", "page"]),
  page_id: z.string().optional(),
  document_asset_id: z.string().uuid().optional(),
})

export const FacebookPayloadSchema = z.object({
  message: z.string().max(63206).optional(),
  page_id: z.string(),
  feeling: z.string().optional(),
})

export const PlatformDataSchema = z.object({
  youtube: YouTubePayloadSchema.optional(),
  tiktok: TikTokPayloadSchema.optional(),
  instagram: InstagramPayloadSchema.optional(),
  x: XPayloadSchema.optional(),
  linkedin: LinkedInPayloadSchema.optional(),
  facebook: FacebookPayloadSchema.optional(),
})

// QStash webhook body
export const QStashWebhookSchema = z.object({
  post_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
})
```

**Layer 2 Contract Enforcement:** Every platform publisher wraps API responses with `z.safeParse()`. On parse failure, the job fails with `error_code: "PLATFORM_API_SCHEMA_DRIFT"` — alerting you that the platform changed their response format before it causes a null dereference at 2am.

---

## Database Schema

```sql
-- Multi-tenant root
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',          -- free | pro | team
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team support
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',        -- owner | admin | member
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Connected platform accounts
-- Tokens encrypted at app layer with AES-256-GCM (@noble/ciphers), key in env var
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,                     -- youtube|tiktok|instagram|x|linkedin|facebook
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  platform_display_name TEXT,
  platform_avatar_url TEXT,
  platform_metadata JSONB,                    -- channel_id, page_id, etc.
  access_token TEXT NOT NULL,                 -- AES-256-GCM encrypted
  refresh_token TEXT,                         -- AES-256-GCM encrypted
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_refreshed_at TIMESTAMPTZ,
  UNIQUE(workspace_id, platform, platform_user_id)
);

-- Posts (core entity)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  caption TEXT,
  -- JSONB validated by PlatformDataSchema on write
  platform_data JSONB NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',     -- ['youtube', 'instagram']
  media_assets UUID[],                        -- ordered refs to media_assets.id
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',       -- draft|scheduled|publishing|published|failed|cancelled
  qstash_message_id TEXT,                     -- for cancellation
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-platform publish results (one row per platform per post attempt)
CREATE TABLE post_platform_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  social_account_id UUID REFERENCES social_accounts(id),
  status TEXT NOT NULL DEFAULT 'pending',     -- pending|publishing|published|failed
  platform_post_id TEXT,
  platform_post_url TEXT,
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  UNIQUE(post_id, platform)
);

-- Media assets
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  r2_key TEXT NOT NULL,
  r2_bucket TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT NOT NULL,
  duration_seconds NUMERIC,
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  mux_status TEXT,                            -- preparing | ready | errored
  width INTEGER,
  height INTEGER,
  processing_status TEXT DEFAULT 'pending',   -- pending|processing|ready|failed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Key indexes
CREATE INDEX idx_posts_workspace_scheduled
  ON posts(workspace_id, scheduled_at) WHERE status IN ('draft', 'scheduled');
CREATE INDEX idx_post_results_status
  ON post_platform_results(status, last_attempted_at) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_social_accounts_expiring
  ON social_accounts(workspace_id, platform) WHERE is_active = true;
```

**RLS:** Every table uses workspace-scoped Row Level Security via `workspace_members` join. Pattern:
```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON posts
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
```

---

## API Routes

```
/api/
  auth/callback/             — Supabase OAuth callback

  media/
    presign/                 POST — R2 presigned upload URL + media_asset record
    webhook/r2/              POST — R2 upload complete → trigger Mux ingest
    webhook/mux/             POST — Mux asset ready → update DB
    [id]/                    GET  — media asset metadata

  posts/
    /                        GET (list, filterable), POST (create draft)
    [id]/                    GET, PATCH, DELETE
    [id]/schedule/           POST — validate + enqueue to QStash, status → scheduled
    [id]/cancel/             POST — cancel QStash message, status → draft
    [id]/duplicate/          POST

  jobs/
    publish/                 POST — QStash webhook (HMAC-verified), execute publish
    token-refresh/           POST — QStash webhook, proactive token refresh

  platforms/
    [platform]/oauth/start/     GET — redirect to platform OAuth
    [platform]/oauth/callback/  GET — handle OAuth code, encrypt + store tokens
    [platform]/disconnect/      POST
    [platform]/refresh/         POST — manual token refresh

  workspaces/
    /                        GET, POST
    [id]/                    GET, PATCH, DELETE
    [id]/members/            GET, POST, DELETE

  billing/
    checkout/                POST — create Stripe Checkout session
    portal/                  POST — Stripe Customer Portal session
    webhook/                 POST — Stripe subscription events
```

---

## Scheduling Reliability Pipeline

```
Pre-flight → Enqueue → QStash holds → Execute → Per-platform publish → Realtime push
```

**Pre-flight (at schedule time):**
- Validate all required fields via Zod per platform
- Confirm media assets are `mux_status: ready`
- Confirm social account token valid or will be before publish time
- Reject with specific error if any check fails — never silently queue broken posts

**Execution (`/api/jobs/publish`):**
- Verify QStash HMAC signature (reject unauthorized)
- Fetch post + social accounts + media from DB
- Dispatch per-platform in `Promise.allSettled` (parallel, isolated failures)

**Idempotency:**
- Before processing each platform, check if `post_platform_results` already has `status: published`
- If yes, return 200 — QStash can deliver more than once

**Retry logic per error type:**
- Network errors: 3x with 500ms linear delay
- `429` rate limit: respect `Retry-After` header, re-enqueue via QStash with delay
- `401/403`: attempt token refresh once, retry once, then fail with `error_code: TOKEN_REFRESH_FAILED`
- `5xx` platform error: retry 2x, then fail
- `4xx` content policy (permanent): fail immediately, no retry

**Proactive token refresh:**
- Daily QStash cron at 3 AM UTC
- Query: `token_expires_at < now() + interval '7 days' AND is_active = true`
- Enqueue refresh job for each expiring token
- Posts never fail due to expired tokens

**Monitoring:**
- pg_cron every 15 minutes: check posts stuck in `status: publishing` for >10 minutes
- Alert via Supabase Edge Function webhook → Slack/email

---

## OAuth — All 6 Platforms

| Platform | API | Key Scopes | Token Lifetime | Notes |
|----------|-----|------------|----------------|-------|
| YouTube | Google OAuth / Data API v3 | `youtube.upload` | 1hr access / long refresh | Resumable upload |
| TikTok | Content Posting API | `video.publish` | ~24hr / 365d refresh | **App review required (2–4 weeks)** — plan ahead |
| Instagram | Facebook/Instagram Graph API | `instagram_content_publish` | 60d long-lived | Requires FB Page connected to Creator account |
| X | OAuth 2.0 PKCE / v2 | `tweet.write`, `media.write`, `offline.access` | ~2hr / refresh token | Chunked video upload |
| LinkedIn | OAuth 2.0 | `w_member_social` | 60d (no auto-refresh) | Re-auth required at 60 days |
| Facebook | Graph API | `pages_manage_posts` | Permanent page token | Derived from long-lived user token |

---

## The Outlier Engine (Phase 2)

The feature that makes SCAPE 10x better than Buffer, not just prettier. While Buffer waits for you to type, SCAPE watches your niche and proposes posts before you open the tab.

**Data sources (Phase 2 prioritization):**
1. Your own analytics — what performed best by platform, day-of-week, hour (available at launch via publish_analytics table)
2. TikTok/YouTube/Instagram trending content in your niche category (platform APIs)
3. Competitor content performance (public data)

**Human provenance (anti-"faceless corporate spam"):**
- Every trend card shows the source: "12 creators in your niche posted about this in 24h"
- "Trending on TikTok AI — 3.2M avg views, started 6 hours ago"
- Never just "AI suggests post this" — the data has a face

**Bento tile on Dashboard:**
- "OUTLIER SIGNAL" section: 2–3 trend cards
- Each card: trend headline + provenance + "Draft a post" → opens composer with pre-filled context
- Phase 3: scrape GitHub/ArXiv/X for AI-niche creators specifically (togglable signal source)

---

## Billing

| Tier | Price | Key Limits |
|------|-------|------------|
| **Free** | $0 | 3 social accounts, 10 posts/month, 500MB storage, 1 user |
| **Pro** | $19/mo ($15 annual) | All 6 platforms, unlimited posts, 50GB storage, 1 user, AI captions, analytics |
| **Team** | $49/mo ($39 annual) | Everything Pro + 5 members, 3 workspaces, 200GB, approval workflows, API access |

Positioning: below Buffer ($15+/channel/month), far below Hootsuite ($99+/month). No per-seat pricing. One workspace price, full access.

**Free tier watermark:** "via @scape.studio" appended to Instagram captions — creator attribution that doubles as marketing. Removable on Pro.

---

## File Structure

```
scape/                              # New standalone project (not inside gstack)
├── app/
│   ├── page.tsx                    # Marketing landing page
│   ├── globals.css                 # Design tokens, CSS custom properties, grain texture
│   ├── auth/page.tsx               # Magic link entry
│   ├── auth/callback/route.ts      # Supabase auth callback
│   │
│   ├── (app)/layout.tsx            # Auth guard + app shell
│   ├── (app)/home/page.tsx         # Bento command center
│   ├── (app)/calendar/page.tsx     # Visual calendar
│   ├── (app)/queue/page.tsx        # Scheduled posts feed
│   ├── (app)/@modal/(.)compose/    # Parallel route: composer modal
│   └── (app)/settings/
│       ├── page.tsx
│       ├── accounts/page.tsx       # Platform connections
│       └── billing/page.tsx
│
│   api/
│   ├── jobs/publish/route.ts       # QStash webhook (the critical path)
│   ├── jobs/token-refresh/route.ts
│   ├── media/presign/route.ts
│   ├── media/webhook/r2/route.ts
│   ├── media/webhook/mux/route.ts
│   ├── platforms/[platform]/oauth/start/route.ts
│   ├── platforms/[platform]/oauth/callback/route.ts
│   └── billing/webhook/route.ts    # Stripe webhook
│
├── components/
│   ├── composer/                   # THE HERO FEATURE
│   │   ├── Composer.tsx            # Root, Zustand state
│   │   ├── PlatformSelector.tsx    # 6-platform pill row
│   │   ├── MediaUploadZone.tsx     # Morphing aspect ratio zone
│   │   ├── DateTimePicker.tsx      # Shared scheduler UI
│   │   ├── CharacterCounter.tsx    # Circular SVG arc for X
│   │   ├── platforms/              # YouTubeFields, TikTokFields, InstagramFields, XFields, LinkedInFields, FacebookFields
│   │   └── previews/               # YouTubePreview, TikTokPreview (phone frame), InstagramPreview, etc.
│   ├── calendar/
│   │   ├── CalendarView.tsx        # Month view container
│   │   ├── CalendarDay.tsx         # Day cell with platform-colored post cards
│   │   └── CalendarPostCard.tsx    # Draggable card (dnd-kit, Phase 2)
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── CommandPalette.tsx      # Cmd+K global palette
│   └── shared/
│       ├── PlatformIcon.tsx
│       ├── StatusBadge.tsx         # Scheduled / Published / Failed
│       └── GrainOverlay.tsx        # SVG feTurbulence grain
│
├── lib/
│   ├── schemas/platform.ts         # ALL ZOD SCHEMAS — single source of truth
│   ├── platforms/                  # youtube.ts, tiktok.ts, instagram.ts, x.ts, linkedin.ts, facebook.ts
│   ├── crypto/tokens.ts            # AES-256-GCM token encrypt/decrypt
│   ├── qstash/client.ts            # Enqueue + HMAC verify
│   ├── r2/client.ts                # Presigned URL generation
│   ├── mux/client.ts               # Asset management + thumbnail
│   └── supabase/                   # server.ts + client.ts + middleware.ts
│
├── store/composer.ts               # Zustand: platform state, field values, media
├── types/database.ts               # Auto-generated: `supabase gen types typescript`
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 002_rls_policies.sql
        └── 003_indexes.sql
```

---

## Implementation Phases

### Phase 1 — MVP (Weeks 1–6)

Goal: Creator connects YouTube + Instagram, composes a post, schedules it, it publishes reliably. The morph animation is beautiful. Nothing else ships until this is perfect.

| Week | Focus |
|------|-------|
| 1–2 | Foundation: Next.js 15 + Supabase + Tailwind v4 + design tokens + Clash Display + grain texture |
| 3 | Morphing Composer (YouTube + Instagram fields, previews, the morph animation) |
| 4 | Media: R2 presign flow for images, Mux video pipeline |
| 5 | Scheduling pipeline: QStash, Google/Instagram OAuth, token encryption, Realtime push |
| 6 | Dashboard + Calendar + Queue + Error states + Free tier limits |

**Phase 1 launch criteria:**
- The morph animation between YouTube and Instagram is beautiful and fast
- A post scheduled for both platforms actually publishes to both
- Failed posts are loud and retryable with one click
- No broken loading states, no silent failures

### Phase 2 — Core Platform (Weeks 7–12)

- Add TikTok + X + LinkedIn + Facebook (publishers + OAuth + fields + previews)
- Full video pipeline (Mux + TikTok phone frame preview)
- Calendar drag-and-drop rescheduling (dnd-kit)
- Outlier Engine MVP (your own analytics → best time suggestions)
- AI caption suggestions via Claude API (platform-aware, not generic)
- Stripe billing
- Team tier: invites + approval workflows
- Command palette (Cmd+K)

### Phase 3 — Growth (Weeks 13–20)

- Outlier Engine v2: competitor signals, niche trend scraping
- Thread builder for X
- LinkedIn PDF → carousel upload
- Instagram first comment scheduling
- Analytics: engagement data via platform APIs
- Mobile (React Native, shares `lib/platforms/` publishers)
- Browser extension: "Schedule this video" on YouTube/TikTok while browsing
- API access (Team tier) with webhooks

---

## Verification Plan

1. `pnpm dev` — Tailwind v4 tokens resolve, Clash Display loads, grain texture visible at 2.5% opacity
2. Auth: magic link sends, callback redirects to `/home`
3. Composer: select YouTube → Instagram. Fields animate in/out with spring physics. Preview switches.
4. Upload image: R2 upload completes, `media_assets.processing_status = ready`
5. Upload video: Mux `asset_id` stored, `mux_status = ready`, thumbnail resolves
6. Schedule a post: QStash `messageId` stored in DB, `post.status = scheduled`
7. Wait for scheduled time: `post_platform_results` rows update to `published`
8. Confirm Supabase Realtime pushes status update to browser without refresh
9. Force publish failure (disconnect account): failure is loud in UI, retry button present and functional
10. Stripe: checkout creates subscription, webhook updates `workspaces.plan`
11. TikTok app review: apply for `video.publish` scope at project kickoff — 2–4 week lead time

---

## Open Questions for Implementation

1. **TikTok app review lead time:** Apply for `video.publish` scope on day 1. The 2–4 week review window is the longest external dependency. Phase 1 can ship without TikTok and add it in Phase 2.

2. **Instagram first post:** The Instagram Graph API requires a Facebook Page connected to a Creator/Business account. Consider adding a setup wizard that walks users through this connection — it's a common stumbling block.

3. **LinkedIn 60-day token expiry:** LinkedIn has no refresh token — users must re-authenticate every 60 days. Build a proactive "reconnect LinkedIn" prompt 7 days before expiry. Consider whether this is a blocker for Phase 1 or Phase 2.

4. **Storage quota enforcement:** Free tier is 500MB. R2 doesn't have built-in per-prefix quotas. Enforce by checking `SUM(file_size)` per workspace before accepting new uploads.
