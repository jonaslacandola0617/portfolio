# Architecture

Current production architecture for the portfolio and private CMS.

## System overview

```text
Public Next.js pages
        │ read
        ▼
lib/content.ts + lib/db/queries/*
        │
        ▼
Prisma Client ──► Neon PostgreSQL
        ▲
        │ write/read
Private /admin CMS
        │
        ├─ Server Actions for content and settings
        └─ authenticated Vercel Blob upload routes
```

PostgreSQL is the runtime source of truth.

## Public application

Active public routes include:

```text
/
/about
/projects
/projects/[slug]
/labs
/labs/[slug]
/journal
/journal/[slug]
/certifications
/resume
/contact
/tags/[tag]
/sitemap.xml
```

Projects, Labs, Journal entries, Certifications, Skills, Tags, Categories, Media, and Site Settings are database-backed.

## Private CMS

The CMS lives under `/admin` and includes management for Projects, Labs, Journal entries, Certificates, Skills, Media, About content, and site settings.

GitHub OAuth protects the admin area. `ADMIN_EMAIL` is the single-admin allowlist. Protected layouts and mutations perform the actual session verification; middleware only provides an early redirect when no session cookie is present.

## Homepage content

The public homepage (hero, availability, numbers, experience, "What I bring" cards, Outside IT, section titles and visibility, and the AI-assisted wording) is stored as JSON in `SiteSettings.homepage` and edited at `/admin/homepage`. `lib/validations/homepage.ts` defines the shape; `lib/db/queries/homepage.ts` validates each part separately and falls back to `lib/homepage-defaults.ts` for anything missing or invalid. Projects carry an `aiAssisted` flag, set per project in the project editor.

The admin dashboard runs content-health checks (`lib/services/content-health-service.ts`) for things employers notice: résumé, photo, certificate verify links, project screenshots, lab tags and drafts.

## Editor and rendering

Long-form content is stored as TipTap/ProseMirror JSON. The admin editor uses `@tiptap/react`, while the public site renders the stored JSON with server-safe React components.

Editor payloads are validated before persistence, and Prisma JSON writes pass through the shared JSON serialization boundary.

## Media

Reusable content media is stored in Vercel Blob and referenced by the `Media` model. Upload routes require an authenticated admin session.

The About profile image is stored separately from the Media Library because it is a site identity asset rather than reusable content media.

## Revalidation and builds

Content mutations revalidate the public and admin routes affected by the change. The build uses a database preflight so database failures do not silently publish empty pages.

## Database migrations

Schema changes are tracked through Prisma migrations. Existing migrations remain in version control because they are required to reproduce and upgrade the production database safely.

## Repository policy

The repository should contain the current application, current architecture documentation, migrations, and useful verification scripts. Temporary handoff documents, old implementation reports, demo content, one-off migration utilities, and generated-development artifacts should be removed once they are no longer required by the live application.
