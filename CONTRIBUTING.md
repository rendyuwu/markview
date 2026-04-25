# Contributing to MarkView

Thank you for your interest in contributing to MarkView! This guide covers everything you need to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Issue Guidelines](#issue-guidelines)
- [Code Style](#code-style)
- [Design System](#design-system)
- [Testing](#testing)
- [Security](#security)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

**We do not tolerate:**
- Harassment, discrimination, or personal attacks
- Trolling or deliberately inflammatory comments
- Publishing others' private information

Violations may result in being banned from the project.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- **PostgreSQL** (local instance or hosted)
- **npm** (comes with Node.js)

### Development Setup

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/<your-username>/markview.git
   cd markview
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Fill in your `.env`:
   | Variable | Required | Description |
   |---|---|---|
   | `DATABASE_URL` | Yes | PostgreSQL connection string |
   | `SESSION_SECRET` | Yes | Random string, min 32 characters |
   | `ENABLE_REGISTER` | No | `"true"` to allow public registration |
   | `NEXT_PUBLIC_APP_NAME` | No | App display name (default: `MarkView`) |

4. **Run database migrations:**

   ```bash
   npx prisma migrate dev
   ```

5. **Start the dev server:**

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:3344`.

6. **Create your admin account:**

   Visit `/setup` on first run to create the initial user. This page is only available when no users exist in the database.

---

## Project Structure

```
markview/
├── prisma/                  # Database schema and migrations
│   └── schema.prisma        # Prisma schema (User, MarkdownDocument)
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── editor/          # Editor pages (new + edit)
│   │   ├── view/[token]/    # Public shared view (RSC)
│   │   ├── login/           # Auth pages
│   │   ├── register/
│   │   └── setup/           # First-user setup
│   ├── components/          # React components
│   │   └── MarkdownRenderer.tsx  # Shared renderer (editor + view)
│   ├── lib/                 # Utilities and business logic
│   │   ├── auth.ts          # Session helpers (iron-session)
│   │   ├── auth-guard.ts    # Route-level auth guard
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── url-import.ts    # URL import with SSRF protection
│   │   └── __tests__/       # Unit tests (Vitest)
│   └── middleware.ts        # Auth middleware
├── e2e/                     # Playwright end-to-end tests
├── DESIGN.md                # Design system specification
├── SPEC.md                  # Project specification (SDD)
└── PRODUCTION.md            # Deployment guide
```

---

## Development Workflow

### Branch Naming

Use descriptive branch names with a type prefix:

```
feat/add-document-search
fix/share-link-expiry-bug
docs/update-readme
refactor/auth-middleware
test/add-editor-e2e-tests
chore/update-dependencies
```

### Working on an Issue

1. Check existing issues or create a new one before starting work.
2. Comment on the issue to let others know you're working on it.
3. Create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Make your changes in small, focused commits.
5. Ensure all checks pass before submitting a PR:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
6. Push and open a pull request.

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow this format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructuring (no feature/fix) |
| `test` | Adding or updating tests |
| `chore` | Build, tooling, dependency updates |
| `perf` | Performance improvement |
| `ci` | CI/CD configuration |
| `revert` | Reverting a previous commit |

### Scope (optional)

Use a short identifier for the area of change:

- `ui` — frontend components, styles
- `auth` — authentication, sessions
- `api` — API routes
- `db` — database, Prisma schema, migrations
- `editor` — editor page/component
- `view` — shared view page
- `spec` — SPEC.md changes

### Rules

- **Subject line:** imperative mood, lowercase, no period, max 50 characters
  - Good: `feat(editor): add keyboard shortcuts for bold and italic`
  - Bad: `Added keyboard shortcuts.`
- **Body:** explain *why*, not *what*. Wrap at 72 characters.
- **Breaking changes:** add `BREAKING CHANGE:` in the footer or `!` after the type.

### Examples

```
feat(view): add copy-to-clipboard button on shared pages

fix(auth): prevent session fixation on login

docs: add contributing guide

refactor(api): extract document validation into shared helper

fix(ui)!: replace custom modal with native dialog element

BREAKING CHANGE: Modal component API changed — `isOpen` prop renamed to `open`.
```

---

## Pull Requests

### Before Submitting

- [ ] Branch is up to date with `main`
- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] E2E tests pass if you changed UI (`npm run test:e2e`)
- [ ] New features include tests
- [ ] No `.env` values, secrets, or credentials committed

### PR Title

Follow the same Conventional Commits format as commit messages:

```
feat(editor): add markdown table toolbar button
fix(view): handle expired documents gracefully
```

### PR Description

Use this template:

```markdown
## Summary

Brief description of what changed and why.

## Changes

- Bullet list of specific changes

## Testing

- How you tested the changes
- Any manual testing steps for reviewers

## Screenshots (if UI change)

Before/after screenshots or screen recordings.

## Related Issues

Closes #123
```

### Review Process

1. All PRs require at least one approving review.
2. Maintainers may request changes — address feedback in new commits (don't force-push during review).
3. Once approved, a maintainer will merge using **squash and merge**.
4. Delete your branch after merge.

### What We Look For in Reviews

- Correctness and edge case handling
- Adherence to the [design system](#design-system)
- Test coverage for new behavior
- No security vulnerabilities (see [Security](#security))
- Clean, readable code without unnecessary abstractions

---

## Issue Guidelines

### Bug Reports

Use the **Bug Report** issue template. Include:

- **Steps to reproduce** — exact sequence to trigger the bug
- **Expected behavior** — what should happen
- **Actual behavior** — what actually happens
- **Environment** — browser, OS, Node version
- **Screenshots/logs** — if applicable

### Feature Requests

Use the **Feature Request** issue template. Include:

- **Problem statement** — what problem does this solve?
- **Proposed solution** — how should it work?
- **Alternatives considered** — what else did you think about?

### Labels

| Label | Meaning |
|---|---|
| `bug` | Something is broken |
| `feature` | New functionality |
| `docs` | Documentation improvement |
| `good first issue` | Suitable for new contributors |
| `help wanted` | Extra attention needed |
| `duplicate` | Already reported |
| `wontfix` | Not planned |
| `breaking` | Introduces breaking changes |
| `security` | Security-related |

---

## Code Style

### General Rules

- **TypeScript** is required for all source files.
- **ESLint** enforces code style — run `npm run lint` before committing.
- Use `@/*` path aliases for imports (maps to `./src/*`).
- Prefer named exports over default exports.
- Keep files focused — one component or utility per file.

### Formatting

- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multiline structures

### React / Next.js Patterns

- Use **Server Components** by default. Only add `"use client"` when you need browser APIs, event handlers, or hooks.
- Colocate page-specific components in the page directory.
- Shared components go in `src/components/`.
- Shared utilities go in `src/lib/`.

### Database

- All schema changes require a Prisma migration (`npx prisma migrate dev --name descriptive-name`).
- Never modify existing migrations — create new ones.
- Regenerate the Prisma client after schema changes (`npx prisma generate`).

---

## Design System

MarkView follows an **Ollama-inspired grayscale design system** defined in [`DESIGN.md`](./DESIGN.md). All UI contributions must adhere to these rules:

### Key Rules

| Rule | Detail |
|---|---|
| Colors | Grayscale only. No chromatic colors except blue focus ring (`#3b82f6` at 50%) |
| Border radius | Binary: `12px` for containers, `9999px` (pill) for interactive elements |
| Shadows | None. Zero shadows on any element |
| Font weights | `400` (regular) or `500` (medium) only. Never bold |
| Display font | SF Pro Rounded for headings |
| Buttons | Always pill-shaped, `10px 24px` padding |

### Before Submitting UI Changes

1. Read [`DESIGN.md`](./DESIGN.md) in full.
2. Verify your changes match the grayscale palette.
3. Check border radius values (12px or 9999px — nothing in between).
4. Confirm zero shadows.
5. Include before/after screenshots in your PR.

---

## Testing

### Unit Tests (Vitest)

```bash
npm run test                    # run all unit tests
npx vitest run src/lib/__tests__/url-import.test.ts  # single file
```

- Tests live in `src/lib/__tests__/`.
- Name test files `*.test.ts` or `*.test.tsx`.
- Test business logic and utilities. Mock external dependencies (database, network) sparingly.

### End-to-End Tests (Playwright)

```bash
npm run dev          # start dev server first (port 3344)
npm run test:e2e     # run e2e tests
```

- E2E tests live in `e2e/`.
- Test user-facing flows: login, create document, share, view.
- Use Playwright's locator API — avoid fragile CSS selectors.

### What to Test

- **New features:** at least one happy-path test and one edge case.
- **Bug fixes:** add a regression test that would have caught the bug.
- **Refactors:** existing tests should still pass. Add tests if coverage gaps exist.

---

## Security

### Reporting Vulnerabilities

**Do not open a public issue for security vulnerabilities.**

Email security concerns to the maintainers directly (see the repository's security policy). Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you on a fix before public disclosure.

### Security Considerations for Contributors

- **Never commit secrets** — `.env` files, API keys, passwords, tokens.
- **SSRF protection** — URL imports block private IPs and localhost. Don't weaken these checks.
- **Auth boundaries** — the middleware and route guards are the security perimeter. Changes to `src/middleware.ts` or `src/lib/auth-guard.ts` require extra scrutiny.
- **Input sanitization** — markdown rendering uses `rehype-sanitize`. Don't bypass or weaken the sanitizer.
- **SQL injection** — we use Prisma's parameterized queries. Never use raw SQL without parameterization.

---

## License

By contributing to MarkView, you agree that your contributions will be licensed under the same license as the project.

---

## Questions?

Open a [Discussion](../../discussions) or comment on a relevant issue. We're happy to help new contributors get started.
