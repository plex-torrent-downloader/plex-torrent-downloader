# Plex Torrent Downloader
This is an open source project to enhance Plex and Jellyfin servers. It uses Remix as the main framework.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (build + start with nodemon watch)
npm run dev

# Build only
npm run build

# Start production server
npm run start

# Database setup (migrate + seed)
npm run setup

# Prisma migrate only
npx prisma migrate deploy

# Regenerate Prisma client after schema changes
npx prisma generate

# Type checking
npm run typecheck

# Run all e2e tests (headless)
npm run test:e2e:run

# Open Cypress UI
npx cypress open
```

> HMR is not available. The dev workflow is build-on-save via nodemon.

## Architecture

For a full technical overview see [TECHNICAL.md](./TECHNICAL.md).

### Request flow

`server.ts` boots an **Express** HTTP server that:
1. Runs `api/router.ts` first — handles auth middleware, all `/collections`, `/transcode`, `/scheduled_downloads`, `/add`, and `/actions/*` REST endpoints
2. Falls through to **Remix** (`createRequestHandler`) for all page routes, passing `settings` and `torrents` as loader context

The Remix app lives entirely in `app/`. Routes are in `app/routes/` using file-based routing. Loaders and actions run server-side; the client gets hydrated React.

### Key server singletons (`*.server.ts`)

These modules export singleton instances instantiated at import time:

| File | What it does |
|---|---|
| `app/db.server.ts` | Prisma client |
| `app/torrents.server.ts` | WebTorrent wrapper — add/remove/track torrents |
| `app/scheduler.server.ts` | Polls every 20 min, searches for and downloads scheduled episodes, auto-increments episode number on success |
| `app/search.server.ts` | Dispatches searches to the configured engine |
| `api/socketio.ts` | Socket.io server for real-time progress events |

`scheduler.server.ts` is imported directly in `server.ts` so it starts on boot.

### Search engines

Each engine is its own file (`searchTPB.server.ts`, `search1377xto.server.ts`, `searchnyaasi.server.ts`) and scrapes the torrent site using Axios + Cheerio. `search.server.ts` wraps them and dispatches based on the `Settings.searchEngine` value.

### Auth

Auth is JWT-based. `api/authRoutes.ts` middleware runs on every request — it reads the `auth` cookie, verifies it against the bcrypt-hashed password stored in `Settings`, and attaches `settings` and `torrents` to the Express request. Remix loaders receive these via `context`.

### Database

SQLite via Prisma. Schema is in `prisma/schema.prisma`. The main models are `Settings`, `Collections`, `ScheduledDownloads`, `SearchResults`, `RecentSearches`, and `Downloaded`.

### Styling

Tailwind CSS. The source stylesheet is `app/styles/tailwind.css`. All inputs and selects should use `py-2` and `text-base` (enforced via `@layer base` in that file — do not add `text-sm` to input/select elements).

### UI components

Shared components live in `app/components/`. `Modal.tsx` accepts an optional `className` prop to override its default `max-w-lg` width.

### E2E tests

Cypress tests are in `cypress/` with one spec per route (e.g. `collections.cy.ts`, `search.cy.ts`). Tests use `data-testid` attributes to find elements.
