# raW

raW is a privacy-first social polling and community app. It combines anonymous polls, interest-based community chats, avatar-based identity, rewards, moderation tools, and admin workflows for managing content and user safety.

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn-ui / Radix UI
- Supabase
- Capacitor
- Vercel

## Local Setup

Install dependencies:

```sh
npm ci
```

Create a local environment file:

```sh
cp .env.example .env.local
```

Fill in the required Supabase, auth, analytics, notification, and server values in `.env.local`. Keep secrets out of source control.

Start the frontend:

```sh
npm run dev
```

Start the local API server when backend routes are needed:

```sh
npm run dev:server
```

## Checks

Run unit tests:

```sh
npm run test
```

Run server tests:

```sh
npm run test:server
```

Run lint:

```sh
npm run lint
```

Create a production build:

```sh
npm run build
```

## Deployment

The app is configured for Vercel:

- Framework: Vite
- Install command: `npm ci --prefer-offline`
- Build command: `vite build`
- Output directory: `dist`

Production deployment requires the Vercel project environment variables to match `.env.example`, including Supabase client/server keys, auth secrets, analytics keys, Sentry/PostHog settings, notification credentials, and any cron or AI assistant secrets used by the backend.

**The production backend is `api/`, not `server/`.** Vercel auto-detects every file under the top-level `api/` directory as a Serverless/Edge Function (`export const config = { runtime: "edge" }`), independent of `buildCommand`/`framework`. `vercel.json`'s SPA rewrite already excludes `api/**`, so those functions are reachable at `/api/...` in production. Auth in particular is served by `api/auth/{signup,login,me,logout}.ts` (Supabase RPC + JWT session cookie), which is what the frontend (`src/backend/supabase/controllers/authController.ts`) actually calls.

`server/index.ts` (Express, `npm run dev:server`) is a **separate, local-only auth implementation** (session cookies + bcrypt) that is never started in production and is not reachable from the deployed site — see `docs/architecture-review.md` §2.3/§3.1 (A1) for the known split-brain and the plan to remove it. Required env vars for `api/auth/*` and their failure modes if missing are documented in `docs/SECURITY_NOTES.md`.

## Mobile Builds

Capacitor is configured for native builds. After frontend changes that affect the mobile shell, run:

```sh
npm run cap:sync
```

Then build and test through the native iOS or Android project tooling.

## Repository Notes

- Do not commit `.env.local` or other secret-bearing files.
- Keep pull requests focused and run the relevant checks before review.
- Update `CHANGELOG.md` only for production behavior changes.
