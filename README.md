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

Everything runs on Vercel (two projects from this repo) with MongoDB Atlas. Pushing to `main` deploys both.

- **CI** (GitHub Actions, `.github/workflows/ci.yml`) — lint, typecheck, API tests, API bundle, web build.
- **Web → Vercel project** with root directory `web/` (`web/vercel.json`).
- **API → Vercel project** with root directory `api/` (`api/vercel.json`). `pnpm --filter api build` bundles
  `src/index.ts` (shared engine inlined) into `api/index.js`, which Vercel runs as one Express function.
- **Database → MongoDB Atlas** (free M0, Frankfurt). Functions run in `fra1` next to it.
- Each project skips builds when a commit doesn't touch its code.

| Project | Variable | Value |
|---|---|---|
| API | `MONGODB_URI` | Atlas connection string (`…/keystride?retryWrites=true&w=majority`) |
| API | `COOKIE_SECURE` | `true` |
| API | `TRUST_PROXY` | `true` |
| Web | `API_URL` | `https://<api-project>.vercel.app` (no trailing slash) |
| both | `ENABLE_EXPERIMENTAL_COREPACK` | `1` (use the pinned pnpm version) |

Local development is unchanged: `pnpm dev` runs the API as a normal server (`api/src/dev.ts`).
