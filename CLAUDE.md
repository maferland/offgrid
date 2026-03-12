# Offgrid

Next.js 15 web app — Instagram story manager. Publish, schedule, and repost tagged mentions.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- Vercel Postgres (Neon) + Drizzle ORM
- Vercel Blob (temporary media storage)
- Instagram Graph API

## Build

```bash
bun install
bun run dev          # dev server
bun run build        # production build
```

## Database

```bash
bunx drizzle-kit push   # push schema to DB
bunx drizzle-kit studio # browse DB
```

## Environment Variables

- `POSTGRES_URL` — Vercel Postgres connection string
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token
- `CRON_SECRET` — protects the /api/cron endpoint

## Structure

- `src/app/` — pages (dashboard, publish, queue, mentions, settings) + API routes
- `src/components/` — UI components (sidebar, phone preview, drop zone, etc.)
- `src/lib/` — DB schema, Instagram client, blob helpers
