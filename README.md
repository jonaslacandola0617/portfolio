# Cyber Portfolio CMS

A documentation-style cybersecurity and networking portfolio with a private CMS, built with
Next.js 14, TypeScript, Tailwind CSS, Prisma 6, Neon PostgreSQL, Auth.js, TipTap, and Vercel Blob.

PostgreSQL is the runtime source of truth for Projects, Labs, Journal Articles, Certificates,
Skills, Tags, and Site Settings. Skills are CMS-managed taxonomy used by portfolio content; there
is no standalone public Skills page. Timeline was retired in August 2026 from both the public site
and CMS/backend.

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
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. GitHub sign-in is restricted to `ADMIN_EMAIL`.

## Required migration for Timeline retirement

The migration `20260807173000_remove_timeline` drops the old Timeline tag join table and
`TimelineEntry` table. This is intentionally destructive because Timeline has been removed from the
product. Run the normal migration deployment before starting the updated application against an
existing database:

```bash
npm run db:migrate:deploy
npm run db:generate
```

The About profile-image addition itself requires no schema migration because its URL is stored in
the existing `SiteSettings.aboutPage` JSON value.

## About profile photo

`/admin/about` has a dedicated JPEG/PNG/WebP upload control. It uses its own authenticated Vercel
Blob token route at `/api/admin/about/profile-image/upload`. Profile photos do **not** create a
`Media` database row and do not appear in the Media Library. Replacing/removing a photo cleans up
the prior Blob on a best-effort basis.

## Content and build verification

```bash
npm run validate:editor-content
npm run verify:save-pipeline
npm run audit:content
npm run verify:build-data
npm run verify:revalidation
npm run verify:phase6-data
npm run build
npm run start
```

`npm run build` is intentionally strict. It runs the content/database preflight and sets
`STRICT_BUILD_DATA=1` for `next build`; a database read failure cannot silently become empty
static pages.

## Main routes

Public navigation is Home, About, Projects, Labs, Journal, Certifications, Résumé, and Contact.
`/skills` and `/timeline` are intentionally retired. The private CMS remains under `/admin`, with
Skills management retained and Timeline administration removed.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the current architecture. Historical phase reports under
`docs/` remain implementation history and may describe surfaces that were later retired.
