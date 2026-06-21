# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Pollix

Pollix is a collaborative polling and scheduling platform. Users can create three types of polls: single-choice, multiple-choice, and calendar (date/time availability). Polls are accessible via a short URL (`/polls/:shortId`) and can be voted on without registration. Real-time updates use Supabase Realtime.

## Monorepo Structure

This is a **pnpm + Turborepo** monorepo with three packages:

- `apps/web` — Next.js 14 (App Router) frontend, package name `@planora/web`
- `apps/api` — NestJS backend, package name `@planora/api` (optional; the web app mostly calls Supabase directly)
- `packages/shared` — TypeScript types and Zod validation schemas shared between apps, package name `@planora/shared`

## Commands

Run from the repo root unless otherwise noted:

```bash
pnpm dev                          # start all apps in watch mode
pnpm --filter @planora/web dev    # frontend only (port 3000)
pnpm --filter @planora/api dev    # backend only (port 3001)
pnpm build                        # production build (all apps)
pnpm lint                         # TypeScript type-check (no ESLint)
pnpm test                         # jest --passWithNoTests (both apps)
pnpm format                       # prettier on ts/tsx/md/json
pnpm db:generate                  # regenerate Supabase types → packages/shared/src/types/database.ts
pnpm db:migrate                   # push migrations to Supabase
```

The web app's `lint` script runs `tsc --noEmit`; there is no ESLint enforced in CI.

## Environment Variables

The `.env.local` file must be created at **`apps/web/.env.local`** (not the repo root). Copy from `.env.example`:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side admin operations |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical URL (used for sitemap/metadata) |
| `RESEND_API_KEY` | Optional | Transactional email |
| `NEXT_PUBLIC_GTM_ID` | Optional | Google Tag Manager |
| `NEXT_PUBLIC_COOKIEYES_ID` | Optional | Cookie consent banner |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Optional | GA direct (only if GTM not set) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional | Search Console meta tag |

## Architecture

### How the web app talks to the database

The frontend **calls Supabase directly** in almost all cases — it does not route through the NestJS API. Two Supabase client factories exist:

- `apps/web/lib/supabase/client.ts` — browser client (use in `'use client'` components)
- `apps/web/lib/supabase/server.ts` — server client with cookie handling (use in Server Components and Route Handlers)

The NestJS API (`apps/api`) contains its own Supabase service client and mirrors the same create/vote operations, but it's optional for deployment. All production use of the live site goes through the Next.js app talking directly to Supabase.

### Authentication & anonymous voting

Auth is handled entirely by Supabase Auth (email/password + Google OAuth). The middleware at `apps/web/middleware.ts` calls `updateSession` on every request to refresh the Supabase session cookie.

Anonymous (guest) voters are identified by a UUID stored in `localStorage` under the key `planora_anonymous_id`. This `voter_fingerprint` is written to the `votes` table alongside the vote so that anonymous users can edit or delete their own votes. Logged-in users use `user_id` instead.

### Database schema

Four main tables (all with RLS enabled):

- `profiles` — extends `auth.users` (1:1), auto-created by trigger on signup
- `polls` — `poll_type` enum: `single_choice | multiple_choice | calendar`; `poll_status` enum: `draft | active | closed | expired`
- `poll_options` — either `text` (for choice polls) or `date + start_time + end_time` (for calendar polls)
- `votes` — either `option_id` (regular vote) or `is_not_available = true` (calendar unavailability). A `comment` column (TEXT) is also present if `allow_comments` is true on the poll.

Database columns use `snake_case`; all TypeScript interfaces and the NestJS service mapper convert to `camelCase`.

### Shared package

`packages/shared/src/types/index.ts` — TypeScript interfaces matching the DB schema (camelCase)
`packages/shared/src/schemas/index.ts` — Zod schemas for `createPollSchema`, `createVoteSchema`, `updateProfileSchema`

The shared package is consumed by both `apps/web` and `apps/api`.

### i18n

`next-intl` with two locales: `en` and `it`. The active locale is read from a `locale` cookie, set automatically in the middleware by parsing `Accept-Language`. Translation files live at `apps/web/messages/{en,it}.json`. Use `useTranslations()` in Client Components and `getTranslations()` in Server Components.

### Minecraft design system

The UI has a pixel/Minecraft aesthetic with no border-radius anywhere (`border-radius: 0 !important`). Key conventions:

- **Body font**: `VT323` (utility: default body text)
- **Heading font**: `Pixelify Sans` (tailwind: `font-pixel`)
- **Accent/button font**: `Press Start 2P` (tailwind: `font-press`)
- **MC bevel utilities** defined in `globals.css`:
  - `mc-raised` — raised beveled border (buttons, cards)
  - `mc-inset` — inset/pressed border (inputs, progress bars)
  - `mc-slot` — inventory-slot border style
  - `mc-panel` — flat panel variant
- **Tailwind color palette** includes `mc-*` named colors: `mc-grass`, `mc-stone`, `mc-dirt`, `mc-wood`, `mc-emerald`, `mc-gold`, `mc-diamond`, `mc-redstone`, `mc-obsidian`, `mc-sky`

When adding new UI components, follow the MC aesthetic: use mc-raised/mc-inset borders, avoid rounded corners, prefer the pixel font utilities.

## Animations

### Background scene — `apps/web/components/mc-background.tsx`

A layered SVG landscape animated entirely with **SVG SMIL** (`<animate>` / `<animateTransform>`). Zero JS per frame. The theme (day vs. night) is read from `next-themes` `resolvedTheme` on mount and all colours are recalculated.

Depth layers back-to-front: sky gradient → aurora (night) → stars (night) → shooting stars (night) → moon/sun → drifting clouds → birds (day) → far hills → mid hills → near hills + grass steps → lake with shimmer → foreground trees (sway) → flowers (day) / fireflies (night) → floating motes → background chicken.

Key implementation details:
- **Clouds**: two copies of the same `<CloudCluster>` side-by-side, animated together with a single `translateX` from `0` to `-480` in a seamless infinite loop
- **Trees**: each canopy has an independent `animateTransform type="rotate"` with staggered `begin` offsets so they don't sway in sync
- **Aurora**: 28 bars rendered from a computed array; each has its own opacity + height `<animate>` with different `dur` and `begin`, plus a shared slow `translateX` sway on the parent `<g>`
- **Background chicken**: follows the hill surface via a 10-point `animateTransform type="translate"` path; direction flip is a separate `animateTransform type="scale"` with `calcMode="discrete"` switching at the 50% keyframe

### Walking chicken widget — `apps/web/components/walking-chicken.tsx`

Interactive chicken placed at `absolute bottom-full` of any `position: relative` parent card. Combines CSS animations and SVG SMIL:

| Motion | Mechanism |
|--------|-----------|
| Horizontal walk | CSS `transform: translateX` on `.mc-chicken-pos` (full-width absolute wrapper). Uses `transform` not `left` — GPU-composited, works on iOS Safari. `calc(100% - 34px)` resolves to parent card width because `.mc-chicken-pos` has `width: 100%`. |
| Direction flip | CSS `scaleX(-1)` on `.mc-chicken-flip` at the 50% keyframe |
| Leg steps | SVG SMIL `animateTransform type="rotate"` — two legs in opposite phase at 0.8 s. SMIL allows JS `svg.pauseAnimations()` to freeze legs independently of CSS. |
| Hover pause | `onPointerEnter/Leave` filtered to `pointerType === 'mouse'` → `hovered = true` → `is-paused` class → CSS `animation-play-state: paused` + `svg.pauseAnimations()`. Touch taps are intentionally excluded so mobile scroll never freezes the chicken. |
| Tap reaction | `onClick` → `poke()` → `startled = true` for 1 s → CSS keyframes: `mc-hop` (body), `mc-neck` (head), `mc-wing-f/b` (wings), `mc-fly-a…e` (feather pixels) |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` sets `animation: none` on `.mc-chicken-pos`, `.mc-chicken-flip`, `.mc-chicken-head`. SMIL leg steps are unaffected. |

When adding the chicken to a new page, the parent element must have `position: relative` and a defined width for `calc(100% - 34px)` to resolve correctly.

## Deployment

- **Frontend**: Vercel, root directory `apps/web`
- **Database/Auth/Realtime**: Supabase (free tier)
- **Backend**: optional (Railway or Render), root directory `apps/api`
- Vercel auto-deploys on push to `main`; preview deploys for PRs

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main`:
1. `pnpm lint` — TypeScript type-check
2. `pnpm build` — full build (also catches type errors)
3. `pnpm test` — jest (continue-on-error: true)
