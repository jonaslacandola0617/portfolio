# Jonas Lacandola — Cybersecurity Portfolio

Personal portfolio and private CMS for documenting projects, networking and security labs, certifications, and learning notes.

Live site: https://www.jonasl.online

## Stack

- Next.js 15 and React 19
- TypeScript and Tailwind CSS
- Prisma with Neon PostgreSQL
- Auth.js with GitHub OAuth
- TipTap for long-form content
- Vercel Blob for media storage

## How content works

PostgreSQL is the runtime source of truth for Projects, Labs, Journal entries, Certificates, Skills, Tags, Categories, Media, and Site Settings. Public pages read from the database, while the private `/admin` area manages content through authenticated forms and editor actions.

Projects, Labs, and Journal entries can attach downloadable resources from the shared Media Library, with labels, descriptions, and manual ordering managed in the CMS.

The repository does not ship demo Projects, Labs, or Journal entries. Those are created and maintained through the CMS.

## Local setup

Use Node.js 20 or newer.

```bash
cp .env.example .env
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

Open `http://localhost:3000`.

For a completely empty database, `npm run db:seed` can initialize the Site Settings row. It does not create demo portfolio content.

## Authentication

The CMS uses GitHub OAuth and is restricted to the email configured in `ADMIN_EMAIL`.

Local callback:

```text
http://localhost:3000/api/auth/callback/github
```

Production callback:

```text
https://www.jonasl.online/api/auth/callback/github
```

## Media

CMS media is stored in Vercel Blob. Upload routes are authenticated and require `BLOB_READ_WRITE_TOKEN` in the deployment environment.

## Database migrations

Prisma migration files are intentionally kept in version control so a new database can reproduce the current schema.

```bash
npm run db:migrate:deploy
npm run db:generate
```

## Useful checks

```bash
npm run audit:content
npm run verify:save-pipeline
npm run verify:revalidation
npm run verify:build-data
npm run build
```

See `ARCHITECTURE.md` for a concise overview of the current application structure.
