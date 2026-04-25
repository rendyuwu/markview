# MarkView

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-black.svg)](./CONTRIBUTING.md)

Personal markdown viewer with shareable links.

## Features

- Password-based authentication with bcrypt hashing
- Paste markdown or import from URL
- Shareable read-only links with unique tokens
- Side-by-side editor with live preview
- Automatic 7-day document expiry
- Ollama-inspired grayscale UI (per DESIGN.md)

## Prerequisites

- Node.js 18+
- PostgreSQL

## Setup

```bash
git clone <repo-url> && cd markview
npm install
cp .env.example .env   # fill in DATABASE_URL and SESSION_SECRET
npx prisma migrate dev  # create tables
npm run dev             # start dev server at http://localhost:3000
```

## First-time setup

On first run, visit `/setup` to create the admin account. This page is only available when no users exist in the database — once the first user is created, `/setup` returns 404.

## Registration

Public registration is controlled by the `ENABLE_REGISTER` environment variable. It defaults to `"false"`, meaning only the first-user setup flow works.

Set `ENABLE_REGISTER="true"` in your `.env` to allow anyone to register via `/register`. The first-user setup at `/setup` always works regardless of this setting.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (see `.env.example`) |
| `SESSION_SECRET` | Yes | — | Cookie signing secret (min 32 characters) |
| `ENABLE_REGISTER` | No | `false` | Allow public registration (`"true"` / `"false"`) |
| `NEXT_PUBLIC_APP_NAME` | No | `MarkView` | App display name shown in the UI |

## URL import security

URL imports validate `http`/`https` schemes only. Private IPs (`10.x`, `172.16-31.x`, `192.168.x`, `127.x`, `::1`, `169.254.x`), localhost, and `.local` hostnames are blocked. Responses are limited to 1MB with a 10-second timeout.

## Tech Stack

Next.js 16, TypeScript, PostgreSQL, Prisma 7, Tailwind CSS

## Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a PR.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./.github/SECURITY.md)
- [Design System](./DESIGN.md)

## License

[MIT](./LICENSE)
