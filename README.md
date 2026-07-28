# Cyber Portfolio CMS

A documentation-style cybersecurity and networking portfolio with a private CMS, built with
Next.js 14, TypeScript, Tailwind CSS, Prisma 6, Neon PostgreSQL, Auth.js, TipTap, and Vercel Blob.

PostgreSQL is the runtime source of truth for Projects, Labs, Journal Articles, Certificates,
Timeline entries, Skills, Tags, and Site Settings. Files under `content/` and `lib/data/` are
retained only as idempotent seed/recovery inputs.

## Setup

Use Node.js 20 or newer and npm. Copy `.env.example` to `.env` and fill in the required values.
Never commit `.env`.

Database connection roles:

- `DATABASE_URL`: pooled Neon hostname (`-pooler`) with SSL; used by Prisma Client.
- `DIRECT_URL`: distinct unpooled Neon hostname with SSL; used by Prisma migration/schema tools.

Then run:

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. GitHub sign-in is restricted to `ADMIN_EMAIL`.

## Content and build verification

```bash
npm run validate:editor-content
npm run verify:save-pipeline
npm run audit:content
npm run verify:build-data
npm run build
npm run start
```

`npm run build` is intentionally strict. It runs the content/database preflight and sets
`STRICT_BUILD_DATA=1` for `next build`; a database read failure cannot silently become empty
static pages.

To verify a running production build against real database records:

```bash
# defaults to http://127.0.0.1:3100
npm run verify:site
```

Set `SITE_VERIFY_URL` when the server uses another origin.

## Legacy content migration

Audit mode never writes:

```bash
npm run audit:content
```

The legacy TipTap normalization tool is dry-run by default:

```bash
npm run migrate:content -- --dry-run
npm run migrate:content -- --write
```

Write mode backs up only affected records under the ignored
`backups/content-migrations/` directory, validates normalized documents, and updates them in one
transaction. Do not reseed a live database to repair individual documents.

## Main routes

Public routes include `/projects`, `/labs`, `/journal`, `/certifications`, `/timeline`, `/skills`,
`/tags/[tag]`, `/sitemap.xml`, and the existing informational pages. The private CMS is under
`/admin`.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md), [docs/PROJECT_HANDOFF.md](docs/PROJECT_HANDOFF.md), and
[docs/CODEX_BUILD_DATA_STABILIZATION_REPORT.md](docs/CODEX_BUILD_DATA_STABILIZATION_REPORT.md).

The public design, routes, authentication model, server-side TipTap renderer, and CMS architecture
are intentional. Continue them in place rather than replacing the application.
