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
