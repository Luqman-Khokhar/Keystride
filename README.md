# Keystride

Minimal, buttery-smooth typing speed test with themes, live stats, and a verified leaderboard. pnpm monorepo:

| Package | What |
|---|---|
| `web/` | Next.js 16 (App Router, TypeScript, Tailwind v4, Redux Toolkit Query) |
| `api/` | Express 5 + MongoDB (Mongoose) — auth, results, leaderboard, anti-cheat |
| `packages/engine/` | Shared stats engine + word lists (the server recomputes every result with it) |

## Setup

```bash
pnpm install
cp api/.env.example api/.env     # set MONGODB_URI
cp web/.env.example web/.env     # optional; API_URL defaults to http://localhost:4000
pnpm dev                         # web on :3000, api on :4000
```

Requires Node 22+ and MongoDB 8. The browser only talks to `/api` on the web origin;
Next.js proxies it to the API, so session cookies stay first-party.

## Scripts

- `pnpm dev` — both services · `pnpm dev:web` / `pnpm dev:api` — one
- `pnpm lint` — ESLint (web) + `tsc --noEmit` (api, engine)
- `pnpm --filter api test` — result-verification unit tests
- `pnpm build` — production build of web

## How results are trusted

The client submits the raw keystroke log, not its scores. The API replays the log to rebuild
the typed text, checks the words came from the generator, recomputes WPM/accuracy with the
shared engine, and flags inhuman timing (uniform intervals, impossible bursts, >350 wpm).
Flagged results are stored but never count toward personal bests or leaderboards.

## Deployment

Pushing to `main` deploys automatically:

- **CI** (GitHub Actions, `.github/workflows/ci.yml`) — lint, typecheck, API tests, web build.
- **API → Render** (`render.yaml` Blueprint, free plan) — redeploys only after CI passes and only when API code changes.
- **Web → Vercel** (Hobby, root directory `web/`) — skips builds when only API code changed (`web/vercel.json`).
- **Database → MongoDB Atlas** (free M0).

| Where | Variable | Value |
|---|---|---|
| Render | `MONGODB_URI` | Atlas connection string (`…/keystride?retryWrites=true&w=majority`) |
| Render | `COOKIE_SECURE`, `TRUST_PROXY` | set by `render.yaml` (`true`, `2`) |
| Vercel | `API_URL` | `https://<your-render-service>.onrender.com` |
| Vercel | `ENABLE_EXPERIMENTAL_COREPACK` | `1` (use the pinned pnpm version) |

The free Render instance sleeps after 15 idle minutes; the first API call after that takes ~1 minute.
The typing test itself runs entirely in the browser and is unaffected.
