# SPEC — MarkView

## §G — Goal

Personal markdown viewer. Auth'd users paste/import markdown → stored PostgreSQL w/ 7d expiry → shareable read-only link. Side-by-side editor. First-run setup flow. Ollama-inspired grayscale design per DESIGN.md.

## §C — Constraints

- C1: Next.js App Router + React + TypeScript
- C2: PostgreSQL via Prisma (mature migrations, typed client, broad ecosystem) — existing PostgreSQL instance, connection via `DATABASE_URL` env var. No Docker provisioning needed.
- C3: Tailwind CSS — Ollama design system per DESIGN.md (grayscale, pill/12px radii, zero shadows, SF Pro Rounded display)
- C4: No external auth provider — password auth w/ bcrypt hashing
- C5: Server-side auth checks on all protected routes/actions
- C6: No teams/billing/comments/collab/profiles/tags/analytics/dashboards
- C7: Single reusable MarkdownRenderer — no duplicate render logic
- C8: XSS-safe markdown rendering (sanitized HTML, `rel="noopener noreferrer"` on external links)
- C9: URL import: validate http/https only, block private IPs/localhost/link-local, max 1MB response, 10s timeout
- C10: Markdown content max 500KB
- C11: Share tokens = crypto-random, non-guessable (nanoid or crypto.randomUUID)
- C12: Env `ENABLE_REGISTER=false` controls public registration; setup bypass always works
- C13: Expired docs not viewable — opportunistic cleanup on read
- C14: Secure cookies (httpOnly, secure in prod, sameSite=lax)
- C15: No sensitive env values exposed to client

## §I — Interfaces

### I.pages — Routes
| route | auth | purpose |
|---|---|---|
| `/setup` | none | first-user creation (disabled after first user exists) |
| `/login` | none | login form |
| `/register` | none | register form (gated by ENABLE_REGISTER) |
| `/` | required | home — paste markdown or enter URL |
| `/editor` | required | side-by-side editor + preview |
| `/editor/[id]` | required | edit existing doc |
| `/view/[token]` | none | public read-only rendered markdown |

### I.api — Server Actions / API Routes
| endpoint | method | auth | purpose |
|---|---|---|---|
| `/api/auth/setup` | POST | none* | create first user (*only when 0 users) |
| `/api/auth/login` | POST | none | authenticate, set session cookie |
| `/api/auth/logout` | POST | auth | clear session |
| `/api/auth/register` | POST | none* | register (*only when ENABLE_REGISTER=true) |
| `/api/markdown` | POST | auth | create doc from paste or URL |
| `/api/markdown/[id]` | PUT | auth+owner | update doc |
| `/api/markdown/[id]` | DELETE | auth+owner | soft-delete doc |
| `/view/[token]` | RSC page | none | render doc (public, checks expiry + opportunistic cleanup) |

### I.env — Environment Variables
| var | required | default | purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | — | PostgreSQL connection string (see .env.example) |
| `SESSION_SECRET` | yes | — | cookie signing secret |
| `ENABLE_REGISTER` | no | `false` | allow public registration |
| `NEXT_PUBLIC_APP_NAME` | no | `MarkView` | display name |

### I.db — Data Model
```
User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

MarkdownDocument {
  id          String    @id @default(cuid())
  shareToken  String    @unique @default(nanoid)
  ownerId     String
  owner       User      @relation(fields: [ownerId])
  title       String?
  sourceType  SourceType // PASTE | URL
  sourceUrl   String?
  content     String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  expiresAt   DateTime  // default now()+7d
  isDeleted   Boolean   @default(false)
}

enum SourceType { PASTE URL }
```

### I.ui — Shared Components
| component | purpose |
|---|---|
| Button | primary/secondary/CTA button w/ pill radius |
| Input | text input w/ pill radius |
| Textarea | multiline input w/ container radius |
| AuthForm | shared form wrapper for login/register/setup |
| Header | top nav bar w/ logout |
| LogoutButton | client-side logout trigger |
| ExpiredOrNotFound | fallback for expired/missing docs |
| MarkdownRenderer | sanitized markdown → HTML (single instance, V13) |

## §V — Invariants

- V1: Setup page returns 404 when ≥1 user exists in DB
- V2: All POST/PUT/DELETE on `/api/markdown/*` reject 401 if no valid session
- V3: `/api/auth/register` returns 403 when `ENABLE_REGISTER !== "true"`
- V4: `/api/auth/setup` returns 403 when ≥1 user exists
- V5: `/view/[token]` returns 404 for expired docs (`expiresAt < now()`) or `isDeleted=true`
- V6: MarkdownRenderer sanitizes HTML — no raw `dangerouslySetInnerHTML` without sanitizer
- V7: URL import blocks private IPs (10.x, 172.16-31.x, 192.168.x, 127.x, ::1, 169.254.x, fc00::/7, fe80::/10), localhost, `.local` hostnames
- V8: URL import enforces ≤1MB response body + 10s timeout
- V9: Markdown content stored ≤500KB — reject larger
- V10: Share tokens generated via `crypto.randomUUID()` or nanoid(21) — never sequential IDs
- V11: Passwords hashed w/ bcrypt (cost ≥10) — never stored plaintext
- V12: Session cookies: httpOnly=true, secure=true (prod), sameSite=lax
- V13: Single MarkdownRenderer component used in both `/view/[token]` and `/editor` preview — no duplication
- V14: External links in rendered markdown get `target="_blank" rel="noopener noreferrer"`
- V15: Opportunistic cleanup: on view-page load, delete expired docs (batch, limit 100)
- V16: UI follows DESIGN.md — grayscale only, pill (9999px) for interactive, 12px for containers, zero shadows, SF Pro Rounded for display headings
- V17: Editor page use near-full-width layout — side-by-side needs screen real estate
- V18: View page use wider container on desktop (max-w-[58rem])
- V19: All pages responsive — editor stacks vertical on mobile, view/home/auth pages readable on small screens
- V20: `prisma.config.ts` must be present in any container running Prisma CLI — Prisma 7 reads datasource URL from config file, not schema
- V21: Migrations run in ephemeral one-off container, never inside production app container — app image stays lean, migration failure doesn't affect running app

## §T — Tasks

| id | status | task | cites |
|---|---|---|---|
| T1 | x | scaffold Next.js app w/ TypeScript, Tailwind, Prisma | C1,C2,C3 |
| T2 | x | define Prisma schema (User, MarkdownDocument, SourceType enum) | I.db |
| T3 | x | implement session/auth utilities (cookie-based, bcrypt, middleware) | V2,V11,V12,C4,C5 |
| T4 | x | build setup page + API (first-user creation, guard when users exist) | V1,V4,I.pages,I.api |
| T5 | x | build login page + API | I.pages,I.api,V11 |
| T6 | x | build register page + API (gated by ENABLE_REGISTER) | V3,C12,I.pages,I.api |
| T7 | x | build logout API | I.api |
| T8 | x | build home page — paste/URL input form, create markdown doc | I.pages,V2,V9 |
| T9 | x | implement URL import w/ SSRF protection + size/timeout limits | V7,V8,C9 |
| T10 | x | build MarkdownRenderer component (sanitized, safe links) | V6,V13,V14,C7,C8 |
| T11 | x | build public view page `/view/[token]` w/ expiry check | V5,I.pages |
| T12 | x | build editor page — side-by-side, reuse MarkdownRenderer | V13,I.pages |
| T13 | x | implement markdown CRUD API (create, update, soft-delete) | I.api,V2,V9,V10 |
| T14 | x | build reusable UI components (Button, Input, AuthForm, Header, ExpiredOrNotFound) | C3,V16 |
| T15 | x | implement opportunistic expired-doc cleanup | V15,C13 |
| T16 | x | apply DESIGN.md styling across all pages | V16,C3 |
| T17 | x | add .env.example + README w/ setup instructions | C12,I.env |
| T18 | x | lint + typecheck + build — fix all errors | C1 |
| T19 | x | widen editor layout to near-full-screen | V17,B5 |
| T20 | x | widen view page container for desktop | V18,B6 |
| T21 | x | add responsive layout to all pages (editor stack, auth forms, home, header) | V19,B7 |
| T22 | x | copy `prisma.config.ts` into Docker runner stage | V20,B8 |
| T23 | x | add `migrate` service to docker-compose.prod.yml (builder target, profiles migrate) + update deploy.sh to use `docker compose run --rm migrate` | V21,B9 |

## §B — Bugs

| id | date | cause | fix |
|---|---|---|---|
| B1 | 2025-04-25 | SSRF redirect bypass — `redirect:"follow"` skipped IP check on 3xx targets | manual redirect + re-validate each hop, max 5 |
| B2 | 2025-04-25 | Setup API TOCTOU — concurrent requests both see count=0 | wrapped in `prisma.$transaction()` |
| B3 | 2025-04-25 | IPv6-mapped IPv4 (`::ffff:127.0.0.1`) bypassed SSRF check | extract embedded IPv4 from `::ffff:` prefix, run through isPrivateIPv4 |
| B4 | 2025-04-25 | hover:text-black on links violated DESIGN.md no-hover rule | removed hover class |
| B5 | 2026-04-25 | editor max-w-7xl too narrow for side-by-side dual pane | widen to near-full-screen, V17 |
| B6 | 2026-04-25 | view page max-w-3xl too narrow on desktop | widen to max-w-4xl or max-w-5xl, V18 |
| B7 | 2026-04-25 | no responsive breakpoints — pages unreadable/unusable on mobile | add responsive layout across all pages, V19 |
| B8 | 2026-04-25 | `prisma.config.ts` not copied into Docker runner stage — Prisma 7 reads datasource URL from config file, `migrate deploy` fails | copy `prisma.config.ts` into runner stage |
| B9 | 2026-04-25 | runner Docker stage has no prisma CLI — `deploy.sh` runs migration inside app container, `npx` downloads at runtime | use one-off `migrate` service targeting builder stage w/ `profiles: ["migrate"]`, V21 |
