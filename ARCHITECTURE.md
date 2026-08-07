# Architecture

Current production architecture for the Cyber Portfolio CMS. Historical phase reports under
`docs/` are implementation history; this file describes the active system.

## 1. System overview

```text
Public Next.js pages (Server Components)
        │ read
        ▼
lib/content.ts + lib/db/queries/*
        │
        ▼
Prisma Client ──► Neon PostgreSQL
        ▲
        │ write/read
Private /admin CMS (Auth.js protected)
        │
        ├─ Server Actions for CRUD/editor/settings
        └─ authenticated Vercel Blob upload token routes
```

The database is the runtime source of truth. Static MDX/data files are seed/recovery inputs only.

## 2. Active data model

Prisma models currently in production:

- `Project` — long-form TipTap JSON, project metadata, tags, skills, downloads, optional thumbnail.
- `Lab` — long-form TipTap JSON, metadata, tags, and resources.
- `Article` — journal long-form TipTap JSON plus article metadata.
- `Certificate` — credential metadata, optional long-form content and optional Media logo.
- `Skill` — CMS-managed taxonomy used by Projects/Certificates. It has no public standalone route.
- `Tag` and `Category` — shared public content taxonomy.
- `Media` — Media Library records for editor assets, thumbnails, certificate logos, and resources.
- `Download` — Project/Lab resource links with optional Media association.
- `SiteSettings` — singleton identity/settings row; `aboutPage` is JSON and owns the Bauhaus About
  content contract including the optional profile-image URL.

### Retired Timeline model

Timeline was removed in August 2026. The active Prisma schema has no `TimelineEntry` model and
`Tag` has no Timeline relation. Migration `20260807173000_remove_timeline` drops
`_TagToTimelineEntry` and `TimelineEntry`. The public route, admin CRUD, seed data, queries,
services, validation, revalidation targets, and verification references were removed with it.

Because that migration drops the table, any existing Timeline records are intentionally deleted.

## 3. Public application

Active navigable public pages:

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

`/skills` and `/timeline` are intentionally absent and should return 404. Skills can still appear
as metadata/relationships on relevant portfolio content.

The Bauhaus prototype remains the visual source of truth. Removing routes does not authorize a
new visual design; remaining public surfaces retain the existing Bauhaus tokens, typography,
geometry, spacing, and motion.

## 4. About page and dedicated profile image

The Bauhaus About page content is stored in `SiteSettings.aboutPage` JSON:

```ts
{
  profileImageUrl: string | null;
  quote: string;
  background: string;
  currentFocus: string;
  focusTags: string[];
  learningPhilosophy: string;
  whatsNext: string;
}
```

The JSON boundary remains backward-compatible with older About shapes through
`normalizeAboutPage()`. Adding `profileImageUrl` does not require a Prisma migration.

Profile photo upload is deliberately separate from Media Library architecture:

```text
/admin/about file input
  → @vercel/blob/client upload()
  → /api/admin/about/profile-image/upload
      → requireAdmin()
      → image-only Vercel Blob upload token
  → returned Blob URL
  → updateAboutProfileImageAction()
  → SiteSettings.aboutPage.profileImageUrl
```

No `Media` row is created, so the profile picture never appears in the Media Library. On successful
replacement/removal, the previous profile Blob is deleted on a best-effort basis. The public About
page places the image inside the prototype's existing square portrait frame and applies the same
grayscale presentation and Bauhaus corner markers.

## 5. Private CMS

Active admin surfaces:

```text
/admin
/admin/projects
/admin/labs
/admin/journal
/admin/certificates
/admin/skills
/admin/media
/admin/about
/admin/settings
```

Projects, Labs, Journal, and Certificates use their real metadata forms and TipTap editor where
applicable. Skills remain fully manageable in admin even though the standalone public Skills page
was removed. There is no Timeline admin route or Timeline service layer.

## 6. Authentication

Auth.js GitHub OAuth protects the CMS. `ADMIN_EMAIL` is the single-admin authorization rule.
Middleware performs the cheap session-cookie presence check; `requireAdmin()` performs the real
cryptographic session verification inside protected layouts, Server Actions, and upload token
routes. Every mutation independently calls `requireAdmin()`.

## 7. Editor and rendering

Long-form content is TipTap/ProseMirror JSON. The admin editor uses `@tiptap/react` and the shared
extension contract under `lib/editor/`. Public rendering uses the server-safe recursive
`components/shared/content-renderer.tsx` rather than hydrating an editor instance.

All Prisma JSON writes go through `lib/prisma-json.ts`. Editor content is validated at save and
render boundaries so malformed documents do not silently enter the public site.

## 8. Media storage

The Media Library uses Vercel Blob plus the `Media` model. Its upload path creates a database record
and is intended for reusable CMS content assets. Media deletion checks references before removing
storage/database records.

The About profile photo is the explicit exception: it is a dedicated site-identity asset, uses a
separate authenticated upload route, and stores only its Blob URL in About JSON.

## 9. Revalidation and build policy

`lib/revalidation-targets.ts` is the centralized cache invalidation matrix. There is no Timeline
content type. Skill mutations revalidate admin Skills and Projects because Skills remain content
relationships; they no longer revalidate a public `/skills` page.

Production builds use strict data mode via `scripts/run-strict-build.mjs` and
`verify:build-data`. Database failures must fail the build rather than publish silently empty pages.
`verify:site` additionally checks that retired `/timeline` and `/skills` routes return 404 and are
absent from the sitemap.

## 10. Migrations and seeds

Schema changes are migration-driven. For this retirement:

```text
20260807173000_remove_timeline
  DROP TABLE _TagToTimelineEntry
  DROP TABLE TimelineEntry
```

`prisma/seed/index.ts` seeds Projects, Labs, Articles, Skills, Certificates, the showcase project,
and SiteSettings. It no longer imports or creates Timeline records. Seeds remain idempotent using
stable slugs/names.

For an existing deployment, apply migrations and regenerate Prisma Client before the new build:

```bash
npm run db:migrate:deploy
npm run db:generate
```

## 11. Cleanup rule

When a product surface is retired, remove its route, UI components, service/query/validation layer,
revalidation targets, verification assumptions, and seed/schema dependencies together. Avoid
keeping disconnected compatibility files unless they are required for a live migration or stored
data boundary. Historical migration files and phase reports remain immutable implementation
history.
