# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest `main` | Yes |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please email **github@rendy.dev** or open a [private security advisory](../../security/advisories/new) on GitHub.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact and severity
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 5 business days
- **Fix timeline:** depends on severity, but we aim for:
  - Critical: 24–48 hours
  - High: 1 week
  - Medium/Low: next release cycle

### Disclosure Policy

We follow coordinated disclosure. We will:

1. Confirm the vulnerability and determine its impact.
2. Develop and test a fix.
3. Release the fix and publish a security advisory.
4. Credit the reporter (unless they prefer anonymity).

Please do not publicly disclose the vulnerability until we have released a fix.

## Security Architecture

MarkView has several security-sensitive areas:

| Area | Location | Notes |
|------|----------|-------|
| Authentication | `src/middleware.ts`, `src/lib/auth.ts`, `src/lib/auth-guard.ts` | Cookie-based sessions via iron-session + bcrypt |
| Input sanitization | `src/components/MarkdownRenderer.tsx` | rehype-sanitize prevents XSS in rendered markdown |
| SSRF protection | `src/lib/url-import.ts` | Blocks private IPs, localhost, `.local` hostnames |
| Database | `src/lib/prisma.ts`, `prisma/schema.prisma` | Prisma parameterized queries prevent SQL injection |

Changes to these files require extra review scrutiny.
