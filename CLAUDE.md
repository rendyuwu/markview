# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tone

Terse like caveman. Technical substance exact. Only fluff die.
Drop: articles, filler (just/really/basically), pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE. No revert after many turns. No filler drift.
Code/commits/PRs: normal. Off: "stop caveman" / "normal mode".

## Commands

```bash
npm run dev          # dev server on port 3344
npm run build        # production build
npm run lint         # eslint
npm run test         # vitest unit tests (src/lib/__tests__/)
npm run test:e2e     # playwright e2e (e2e/ dir, needs dev server on 3344)
npx vitest run src/lib/__tests__/url-import.test.ts  # single test file
npx prisma migrate dev   # run migrations
npx prisma generate      # regenerate client after schema changes
```

## Architecture

**Next.js 16 App Router** with PostgreSQL (Prisma 7, pg adapter). Cookie-based auth via iron-session + bcrypt. No external auth provider.

### Auth flow — two layers
1. **Middleware** (`src/middleware.ts`) — checks session on protected page routes (`/`, `/editor/*`) and non-GET `/api/markdown/*`. Redirects unauthenticated page requests to `/login`, returns 401 for API.
2. **Route-level guard** (`src/lib/auth-guard.ts`) — `requireAuth(request)` throws a 401 Response if no session. Used inside individual API route handlers as a second check.

Session helpers in `src/lib/auth.ts` — `getSession()` (server components/actions via `cookies()`), `createSession()`, `destroySession()`, `hashPassword()`, `verifyPassword()`.

### Data model
Two models in `prisma/schema.prisma`: `User` and `MarkdownDocument`. Prisma client generated to `src/generated/prisma/`. Documents have a unique `shareToken` (nanoid), 7-day `expiresAt`, and soft-delete via `isDeleted`.

### Key patterns
- **View page is RSC** — `/view/[token]` is a server component (`src/app/view/[token]/page.tsx`), not an API route. Runs opportunistic expired-doc cleanup on load.
- **Single MarkdownRenderer** — `src/components/MarkdownRenderer.tsx` used in both view page and editor preview. Uses react-markdown + rehype-sanitize + remark-gfm.
- **URL import** — `src/lib/url-import.ts` with SSRF protection (private IP blocking, redirect validation, 1MB/10s limits).
- **Editor** — `/editor` and `/editor/[id]` share `src/app/editor/editor-client.tsx` (client component with side-by-side editing).

### Design system
Ollama-inspired grayscale UI defined in `DESIGN.md`. Strict rules: grayscale only (no chromatic color except blue focus ring), pill radius (9999px) for interactive elements, 12px for containers, zero shadows, SF Pro Rounded for display headings, font weight 400 or 500 only.

## Next.js 16 warning

This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may differ from training data. Read relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Spec-driven development

This project uses `SPEC.md` as the source of truth. Sections: §G (goal), §C (constraints), §I (interfaces), §V (invariants), §T (tasks), §B (bugs). Use `/ck:check` to audit drift between spec and code. Use `/ck:spec` to amend the spec. Use `/ck:build` to implement against it.
