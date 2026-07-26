# Architecture

Standing reference for how this system works. `docs/CMS_MIGRATION_PLAN.md` is the phase-by-phase
transition plan and history; this document is the current-and-target architecture those phases
implement. Phase reports (`docs/PHASE_0_REPORT.md`, `docs/PHASE_1_REPORT.md`, ...) are the
execution log of what actually happened at each step.

**Status: Phase 5 complete, baseline build repair complete (July 26, 2026 — see
`docs/BASELINE_BUILD_REPAIR_REPORT.md`), Phase 6 not yet started.** Media Library (Vercel Blob),
content templates, admin search, and a live Settings screen are all built on top of the full CRUD
from Phase 4. The public site now reads identity/contact fields (name, role, tagline, email,
social links, resume path, "Currently Learning") from the database via
`lib/db/queries/settings.ts`, with the original static `lib/site-config.ts` values as a fail-open
fallback — same resilience pattern as every other query-layer function since Phase 2. Everything
the CMS brief originally asked for now exists in some form; `docs/PHASE_5_REPORT.md` §5 lists
what's still a deliberate simplification rather than a gap. Two real build blockers reported from
the owner's local environment after Phase 5 — a Prisma JSON type error and an Auth.js/Jose Edge
Runtime warning — are now fixed; see §3 and §5.1 for the current, corrected design of the pieces
they touched.

## 1. Overall architecture

```
                    ┌───────────────────────┐
                    │   Public Website       │  Server Components, mostly static
                    │   app/(public pages)   │  generation + on-demand ISR (target)
                    └───────────┬────────────┘
                                │ read-only
                    ┌───────────▼────────────┐
                    │   lib/content.ts        │  Today: fs + gray-matter over content/*.mdx
                    │   (the seam)            │  Target: same function signatures, backed by
                    │                         │  lib/db/queries/* instead
                    └───────────┬────────────┘
                                │ (target state)
              ┌─────────────────┼──────────────────┐
              │                 │                   │
   ┌──────────▼──────┐ ┌────────▼─────────┐ ┌───────▼────────┐
   │ lib/db/queries/  │ │ lib/services/     │ │ Prisma → Neon  │
   │ (read layer)     │ │ (business logic)  │ │ Postgres       │
   └──────────────────┘ └───────────────────┘ └───────▲────────┘
                                                        │ read/write
                    ┌───────────────────────────────────┴──┐
                    │   Private CMS — /admin (this repo)     │
                    │   Auth.js-gated, own layout & sidebar   │
                    │   Server Actions do all mutations        │
                    └─────────────────────────────────────────┘
```

The CMS is the intended single source of truth once migration completes; today it's the
foundation (DB schema + auth + shell) sitting alongside the still-active MDX system.

## 2. Content flow

```
Postgres (Project, Lab, Article, Certificate, TimelineEntry, Skill, Tag, Category, Download tables)
  → lib/db/queries/* (only files that import Prisma — one module per content type)
  → lib/content.ts (Projects/Labs/Articles — same function names as the original MDX version)
    + direct query-layer calls (Certificates/Timeline/Skills — these never had a lib/content.ts
      wrapper even in the MDX era, since they were always structured data, not markdown files)
  → every public page
```

Content (Projects/Labs/Articles) is TipTap JSON, rendered by
`components/shared/content-renderer.tsx` — see §4 for why that's a plain recursive function
rather than a live TipTap editor instance in read-only mode. Every query function fails open
(catches its own Prisma errors, returns `[]`/`undefined` rather than throwing) — every content
page shows an empty state instead of a 500 or a failed build if the database isn't reachable on a
given deploy. Verified this really works, not just reads well: see `docs/PHASE_2_REPORT.md` §3
and `docs/PHASE_3_REPORT.md` §3.

**Migration mechanism.** `prisma/seed/index.ts` seeds all six content types in one run:
Projects/Labs/Articles from `content/*.mdx` (via `prisma/seed/mdx-to-tiptap.ts`'s direct mdast →
TipTap JSON mapper — see the comment at the top of that file for why it's not the HTML-bridge
originally sketched in `docs/CMS_MIGRATION_PLAN.md` §5), Certificates/Timeline/Skills directly
from `lib/data/*.ts` (always structured data, never needed MDX conversion). A final reconciliation
pass connects `Project ↔ Certificate` — skipped during Projects' own seeding in Phase 2, since
Certificate rows didn't exist yet at that point. Every write is Zod-validated
(`lib/validations/content.ts`) before it reaches Postgres, and every upsert keys on a stable
identifier (`slug` for Project/Lab/Article/Certificate/Tag/Category, `(date, title)` for
TimelineEntry, `name` for Skill) so re-running the seed script is safe.

## 3. Authentication

Single admin, no user registration, no roles table — see `auth.ts`.

- **Keep `next-auth` current — it's had critical fixes.** Pinned to `5.0.0-beta.32` as of Phase 5,
  upgraded from `beta.31` after a routine `npm audit` turned up 2 *critical* advisories in
  `next-auth`/`@auth/core` (a configuration-error path that could make existence-based auth checks
  fail open). Fixed by the version bump; see `docs/PHASE_5_REPORT.md` §3 for the full account.
  This is exactly the dependency to *not* let go stale, given it's still on a beta channel (no
  stable v5 release exists yet — checked again this phase, still true as of Phase 0's original
  finding).
- **Provider:** GitHub OAuth only.
- **Session strategy:** JWT, no database adapter. Auth.js encodes the session into a signed
  httpOnly cookie; there is no `User`/`Session`/`Account` table in Postgres.
- **Authorization:** the `signIn` callback in `auth.ts` checks the authenticating GitHub account's
  email against `ADMIN_EMAIL` (validated with Zod — `lib/validations/env.ts`). Anyone can start
  the OAuth flow; only that one email is granted a session.
- **Two independent enforcement points** (defense-in-depth, not redundancy for its own sake):
  1. `middleware.ts` — a cheap, Edge-safe check that the Auth.js session *cookie is present*
     (checks only `authjs.session-token` / `__Secure-authjs.session-token` by name), redirecting
     to the login page if it's entirely absent. **As of the baseline build repair
     (`docs/BASELINE_BUILD_REPAIR_REPORT.md`), this file no longer imports `@/auth` or calls the
     real `auth()`** — it used to, but that pulled the full `next-auth → @auth/core → jose` chain
     into the Edge Runtime bundle Next.js 14 builds for Middleware, and `jose`'s JWE decompression
     path (`CompressionStream`/`DecompressionStream`) isn't an Edge-supported API, which produced a
     build warning. Presence-only cookie checking needs no crypto and no next-auth import, so the
     warning is gone by construction, not suppressed. **This file is explicitly not an
     authorization boundary** — a present-but-forged or stale cookie passes this check every time;
     see point 2.
  2. `lib/services/auth-service.ts`'s `requireAdmin()` — called inside
     `app/admin/(dashboard)/layout.tsx`, a Server Component, which runs in the Node.js runtime (not
     Edge) by default. This is where the real, cryptographic session verification happens: the
     actual `auth()` call, decrypting and validating the signed cookie. `CompressionStream` is a
     standard Node global there, so nothing about *this* check ever produced the Edge warning, and
     nothing about it changed in the repair — only middleware's redundant, weaker duplicate of it
     was removed. If middleware's matcher is ever misconfigured, bypassed, or a forged cookie value
     passes the presence check, the page itself still refuses to render admin data for a session
     that doesn't verify.
- **Mutations:** `signIn`/`signOut` are called from Server Actions
  (`app/admin/login/actions.ts`, `components/admin/sign-out-button.tsx`), not client-side fetches
  to an API route — consistent with the Server-Actions-first convention (§7).

## 4. Rendering pipeline

- **Server Components by default**, everywhere — public and admin. Client Components are the
  exception, used only where interactivity requires it (theme toggle, search dialog, mobile nav,
  the `SiteChrome` pathname check).
- **Public/admin chrome separation:** `components/layout/site-chrome.tsx` decides whether to
  render the public `Sidebar`/`MobileNav`/`SearchDialog` based on pathname (`/admin/*` renders
  bare, then `app/admin/(dashboard)/layout.tsx` adds `AdminSidebar` instead). This was chosen over
  moving every public route into an `app/(site)/` route group specifically to avoid touching the
  location of existing public page files — see the comment in `site-chrome.tsx` for the tradeoff.
- **Public content rendering:** `components/shared/content-renderer.tsx` is a plain recursive
  function (JSON node type → React element), not a live `@tiptap/react` Editor instance in
  `editable: false` mode. ProseMirror's EditorView is DOM-dependent and isn't a natural fit for
  static generation — using it would mean either losing `generateStaticParams` for content pages,
  or hydrating a full editor just to display text. The "can't drift apart" guarantee between
  editor and renderer comes from both being built against the same JSON contract
  (`types/tiptap.ts` + `lib/validations/content.ts`), not from sharing a runtime instance.
- **The admin editor (Phase 4, real as of this phase):** `components/editor/editor-shell.tsx`
  wraps `@tiptap/react`'s `useEditor`, configured by `lib/editor/extensions.ts`. Standard rich
  text (bold/italic/code/link, headings, lists, blockquote, horizontal rule, undo/redo) comes from
  `@tiptap/starter-kit`; tables and task lists from official `@tiptap/extension-*` packages,
  configured so their JSON output matches the schema exactly (`table`/`tableRow`/`tableCell`,
  `taskList`/`taskItem`). The 3 blocks with no official TipTap equivalent — `Callout`,
  `CommandBlock`, `Mermaid` — are hand-written `Node` extensions under `lib/editor/extensions/`,
  each with a React `NodeView` (via `ReactNodeViewRenderer`) that reuses the *exact* display
  component `ContentRenderer` uses for the same node type, so what you see while editing is what
  renders on the public page. A toolbar (`components/editor/toolbar.tsx`) is the primary way to
  insert/format content — no slash-command menu or drag-and-drop reordering yet; see
  `docs/PHASE_4_REPORT.md` §4 for that scope decision.
- **Autosave:** `hooks/use-autosave.ts` debounces `onUpdate` events (2s) and calls a Server Action
  per content type (`autosaveProjectContentAction` for Projects) that re-validates against
  `lib/validations/content.ts` before writing — the same Zod schema the seed script validates
  against, so a malformed autosave payload is rejected the same way a bad migration write would be.
- **Static generation + on-demand ISR (target):** public content pages stay statically generated
  (`generateStaticParams`, unchanged); admin Server Actions call `revalidatePath`/`revalidateTag`
  after a publish so edits go live in seconds without a redeploy.

## 5. Database design

Full schema: `prisma/schema.prisma`. Summary of the decisions that aren't obvious from reading it:

- **`publishStatus` vs `progressStatus` are separate fields**, not one enum — "is this visible on
  the site" (CMS workflow) and "how far along is this lab/project in real life" (domain state) are
  genuinely different axes; conflating them makes some real states unrepresentable (a lab can be
  published while still in-progress).
- **No `User`/`Account`/`Session` tables** — see §3. JWT sessions mean zero auth-related tables.
- **`Tag`/`Category`/`Skill` are shared taxonomy tables**, not per-content-type — `Tag` and
  `Skill` are many-to-many with every content type that uses them; `Category` is one-per-item,
  matching the current MDX frontmatter's cardinality exactly.
- **`Media` is one table**, not separate `Image`/`Media` models — an upload's `type` enum is the
  only real difference; one table is simpler to query for a Media Library grid.
- **`Certificate.slug` is separate from its `id`** — the original static data used a readable id
  like `"ccna"` as a stable cross-reference from `Project.relatedCertification`; cuid()s aren't
  suitable for that, so `slug` carries the same role `id` used to. `id`/`slug` splits like this
  exist wherever the original data had a meaningful string identifier that Prisma's generated
  cuid() can't replace without losing something (compare `Tag`/`Category`, same pattern from
  Phase 0).
- **`completionDate` (Project), `labDate` (Lab), `date` (Article) are separate from `publishedAt`**
  — each one is "when this happened/was written in real life," `publishedAt` is "when the CMS
  made it visible." Found missing from the Phase 0 schema for Project during Phase 2 (caught by
  re-checking against the original type contract field-by-field, not assumed complete); applied
  the same fix proactively for Article during Phase 3 rather than waiting to discover the same gap
  twice.
- **`TimelineEntry` has no natural unique key** — unlike every other content type, the original
  data had no slug-equivalent identifier. The seed script upserts on `(date, title)` together
  instead; see architectural rule #7. Its admin CRUD uses the Prisma `id` directly in
  `/admin/timeline/[id]` — there's no public-facing slug to keep stable, so this is fine.
- **`Skill` has no `publishStatus` and no `content` field** — it's pure taxonomy (name, group,
  level), always visible wherever it's referenced, not a standalone piece of content with its own
  publish lifecycle. Its admin form (`components/admin/skill-form.tsx`) is correspondingly the
  simplest of the six — no status selector, no editor, no scheduling.
- **Reserved, not yet implemented** (commented in `schema.prisma`, not modeled as tables — adding
  them later is purely additive, no existing column changes):
  - **Revision history** — one table per content type (`ProjectRevision`, etc.), mirroring the
    existing non-polymorphic `Download` pattern rather than one generic polymorphic table.
  - **Activity Log** — `lib/db/queries/activity.ts` already returns a typed, empty
    `ActivityItem[]`; the dashboard already renders its empty state. Adding the real
    `ActivityLog` table later means changing one query function's body, nothing above it.
  - **Site Settings** — the `SiteSettings` singleton table has existed since Phase 0; the editor
    screen for it (`/admin/settings`) is real as of Phase 5, and the public site actually reads
    from it now (§2, §3's sibling note). What's still not built: any UI to edit
    `siteConfig.currentFocusStack`/`.stats` (the About-page focus badges and home-page stat
    counters) — deliberately left static, see `docs/PHASE_5_REPORT.md` §2.

## 6. Folder structure

```
app/
  (public routes — unchanged from before the CMS work: page.tsx, about/, projects/, labs/,
   journal/, certifications/, timeline/, skills/, resume/, contact/, tags/)
  admin/
    login/
      page.tsx              Bare (no sidebar) — GitHub sign-in
      actions.ts             signInWithGitHub Server Action
    (dashboard)/             Route group — doesn't affect URLs, just scopes the protected layout
      layout.tsx              requireAdmin() guard + AdminSidebar
      page.tsx                 Dashboard overview
      projects/, labs/, journal/, certificates/, timeline/, skills/
                                All real: list page.tsx, new/page.tsx, [id]/page.tsx,
                                actions.ts. Projects/Labs/Journal/Certificates embed
                                EditorShell (they have a `content` field); Timeline/Skills
                                are metadata-only forms (no `content` field in their schema).
      media/                    Real as of Phase 5 — upload (Vercel Blob) + grid, no CRUD
                                actions.ts needed (no create/edit form, just upload/delete)
      settings/                 Real as of Phase 5 — edits the SiteSettings singleton row
  api/auth/[...nextauth]/route.ts   The one Auth.js-required route handler (§7 explains why)
  api/admin/media/upload/route.ts   The other legitimate API route exception — Vercel Blob's
                                     client-direct-upload token issuance (§7)

components/
  ui/            Presentational primitives (button, card, badge, dialog, ...) — untouched by CMS work
  layout/        Public site chrome (sidebar, mobile-nav) + site-chrome.tsx (the admin/public split)
  shared/        Reusable content components used by public pages. mdx-content.tsx removed
                 Phase 3 — content-renderer.tsx replaced it everywhere.
  admin/         Admin-only components (admin-sidebar, stat-card, empty-state, placeholder-page,
                 project-form.tsx — the metadata form + embedded editor for Projects)
  editor/        toolbar.tsx, editor-shell.tsx (the useEditor wrapper), save-status.tsx

lib/editor/
  extensions.ts             The shared extension list (StarterKit + Table* + TaskList/Item +
                             Link + the 3 custom ones below) — the editor's runtime contract
                             with types/tiptap.ts, same way content-renderer.tsx is the
                             renderer's.
  extensions/
    callout.tsx, command-block.tsx, mermaid.tsx   Custom TipTap Node extensions with React
                                                    NodeViews, each reusing the exact display
                                                    component ContentRenderer uses

content/
  README.md      Explains why these .mdx files are still here (seed source, not live content)
  projects/, labs/, articles/   Unchanged files, now read only by prisma/seed/index.ts

lib/
  db.ts                Prisma client singleton — lazy Proxy construction, not a module-scope
                        `new PrismaClient()`. That distinction is load-bearing, not style: see
                        the comment in the file and docs/PHASE_2_REPORT.md §3.
  db/queries/           ← Public pages and admin pages both call INTO here; neither imports
                          `@/lib/db` (Prisma) directly except these files (one module per
                          content type: projects.ts, labs.ts, articles.ts, certificates.ts,
                          timeline.ts, skills.ts, activity.ts). `import "server-only"` on each.
                          Every function catches its own Prisma errors and fails open (empty
                          list / undefined) rather than throwing — a page or a build should
                          degrade to "no content yet," never crash, if the DB isn't reachable.
  services/             Business logic — orchestrates one or more queries into what a page
                         needs (lib/services/dashboard-service.ts), cross-cutting concerns
                         like auth guards (auth-service.ts), or admin-side mutations
                         (project-admin-service.ts — separate from lib/db/queries/projects.ts,
                         which is public/read-only/PUBLISHED-only; admin needs every status
                         and needs to write).
  validations/           Zod schemas, one file per trust boundary: env.ts (ADMIN_EMAIL),
                         content.ts (the TipTap JSON contract — validates the seed script's
                         output before every write, and defensively re-validates on render).
  reading-time.ts        Estimates read time from TipTap JSON (extracts text, counts words) —
                         the `reading-time` npm package (removed Phase 3) only understood
                         markdown strings.
  content.ts             Project/Lab/Article functions: thin delegation to lib/db/queries/*.
                         Same exported names as the original MDX-reading version throughout —
                         see docs/CMS_MIGRATION_PLAN.md §0 for why that was the point.
  data/                  Seed-only as of Phase 3 (see content/README.md for the equivalent
                         note about content/*.mdx) — certifications.ts, timeline.ts, skills.ts
                         are what prisma/seed/index.ts migrated into Postgres; nothing at
                         request time reads them anymore.
  site-config.ts         Today: runtime source for name/bio/links. Target: seed data only, once
                         SiteSettings is editable from /admin/settings (Phase 5).

prisma/
  schema.prisma
  seed/
    index.ts              Seeds all 6 content types (Projects/Labs/Articles from content/*.mdx,
                           Certificates/Timeline/Skills from lib/data/*.ts), then reconciles
                           Project↔Certificate links. Run via `npm run db:seed`. Every upsert
                           keys on a stable identifier (slug, or (date,title) for TimelineEntry
                           which has none) so re-running it is safe.
    mdx-to-tiptap.ts       MDX → TipTap JSON converter (mdast-based, seed-only, not a runtime
                           dep) — handles headings/paragraphs/lists/marks/code fences, GFM
                           tables, and the <Callout>/<CommandBlock>/<Mermaid> JSX components

types/
  index.ts       Public content types (Project/Lab/Article/... frontmatter shapes) +
                 ContentItem<T> (MDX-backed, string content) / DbContentItem<T> (Prisma-backed,
                 unknown content — see the comment on DbContentItem for why these are separate)
  tiptap.ts       The TipTap JSON schema contract — plain types, no @tiptap/* dependency
  admin.ts       Admin-only types (ActivityItem, DashboardOverview)
  next-auth.d.ts Module augmentation for the custom session.user.isAdmin field

middleware.ts    Route-level /admin/* protection
auth.ts          Auth.js config
```

## 7. Architectural rules (established this phase, apply going forward)

1. **Public and admin pages never call `prisma.*` directly.** Only files under `lib/db/queries/`
   import `@/lib/db`, each guarded by `import "server-only"`.
2. **Business logic lives in `lib/services/`, not in page components.** If a page needs more than
   one query, a side effect (revalidation, logging), or any decision logic, that logic belongs in
   a service function the page calls — not inlined in the `.tsx` file.
3. **Zod validates everything crossing a trust boundary** — environment variables
   (`lib/validations/env.ts`) and the TipTap content contract (`lib/validations/content.ts`,
   added Phase 2) so far. Server Action inputs join this list once Phase 4 adds forms with actual
   user input — neither Phase 2 nor 3 had any (the seed script isn't a Server Action, it's a
   migration script run once from the CLI). One schema file per boundary, colocated under
   `lib/validations/`.
4. **Server Actions are the default for mutations; API routes are the deliberate exception.**
   Exceptions so far, and why each one can't be a Server Action:
   - `app/api/auth/[...nextauth]/route.ts` — GitHub's OAuth redirect is an external HTTP request
     Next.js has to receive at a stable URL; Server Actions can't be a redirect target.
   - `app/api/admin/media/upload/route.ts` — Vercel Blob's client-direct-upload pattern needs a
     route handler to issue a short-lived signed token before the browser uploads straight to
     Blob, bypassing this server for the actual file bytes (Vercel Functions cap request bodies
     around 4.5 MB; PCAP/Packet Tracer/video files routinely exceed that).
   Every other mutation (sign-in/sign-out; all CRUD; media record creation, which happens via a
   Server Action called right after the browser's direct upload resolves, not via this route) is
   a Server Action.
5. **Reserved-but-unimplemented features get a typed seam now, not a TODO comment.** Activity Log
   is the model: a real type (`ActivityItem`), a real query function that returns `[]`, and a
   real empty-state UI — so the eventual implementation changes one function body, not multiple
   layers.
6. **Query layer functions fail open, not closed.** Every function in `lib/db/queries/` catches
   its own Prisma errors and returns an empty/undefined fallback rather than throwing. Found the
   hard way in Phase 2: without this, a single unreachable database turns into a failed
   `next build` (static generation calls query functions directly, outside any request-level
   error boundary) — not a degraded page. `lib/db.ts`'s lazy Proxy construction (§5) and this
   rule work together: the Proxy makes sure the failure happens *inside* a query function's
   `try/catch` instead of at module-import time; this rule makes sure that `catch` block actually
   returns something a page can render instead of re-throwing.
7. **Seed/migration writes are idempotent, keyed on a stable identifier, not blind inserts.**
   Every upsert in `prisma/seed/index.ts` keys on something meaningful — `slug` for
   Project/Lab/Article/Certificate/Tag/Category, `name` for Skill, `(date, title)` for
   TimelineEntry (the one content type with no natural slug — see the comment in `schema.prisma`).
   Re-running the seed script updates existing rows instead of duplicating them, which matters in
   practice: it's the same script used for the initial migration and for recovering after a
   database reset.
8. **Every Server Action independently calls `requireAdmin()`, even under a protected route.**
   `middleware.ts` blocks unauthenticated requests to the *page* that renders a mutation's
   trigger; it says nothing about how the Server Action itself gets invoked, since Next.js exposes
   them as directly callable endpoints. `app/admin/(dashboard)/projects/actions.ts` is the
   reference — every exported action's first line is `await requireAdmin()`, not an assumption
   that reaching the action at all implies the caller was authorized.
9. **Every Prisma `Json`/`Json?` write goes through `lib/prisma-json.ts`'s `toPrismaJson()`, not a
   local cast.** `TipTapDoc`/TipTap's `JSONContent` and Zod-inferred array/object types (e.g.
   `SiteSettings.currentlyLearning`) are structurally JSON-safe at runtime but aren't structurally
   assignable to `Prisma.InputJsonValue` — Prisma's JSON input types require an index signature
   ordinary TypeScript interfaces don't declare. Added during the baseline build repair
   (`docs/BASELINE_BUILD_REPAIR_REPORT.md`) after this exact mismatch broke the production build.
   One shared, JSON-round-trip-based function at every write site, rather than a scattered
   `as unknown as Prisma.InputJsonValue` per call — new content types or new `Json` columns should
   follow the same pattern rather than reintroducing a local cast.

## 8. Migration roadmap (condensed — full detail in `docs/CMS_MIGRATION_PLAN.md`)

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Prisma + Neon schema, `lib/db.ts`, Auth.js foundation | ✅ Done |
| 1 | GitHub OAuth, middleware, `/admin` shell, dashboard, query/service/validation layers | ✅ Done |
| 2 | Migrate & cut over Projects only (seed script, `lib/content.ts` → Prisma for Projects, TipTap renderer) | ✅ Done |
| 3 | Same pattern for Labs, Articles, Certificates, Timeline, Skills; retire MDX | ✅ Done (this phase) |
| 4 | Admin CRUD + TipTap editor, autosave, publish workflow | ✅ Done — editor infrastructure + full CRUD for all 6 content types |
| 5 | Media Library (Blob), templates, admin search, Settings screen | ✅ Done |
| 6 | Cleanup, caching pass, remove unused MDX deps, CMS becomes a showcased Project | Partially done — MDX deps already removed Phase 3; caching pass and the showcased-Project entry remain |
