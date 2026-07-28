# Architecture

Standing reference for how this system works. `docs/CMS_MIGRATION_PLAN.md` is the phase-by-phase
transition plan and history; this document is the current-and-target architecture those phases
implement. Phase reports (`docs/PHASE_0_REPORT.md`, `docs/PHASE_1_REPORT.md`, ...) are the
execution log of what actually happened at each step.

**Status: Phase 6 complete
(July 28, 2026 — see `docs/PHASE_6_REPORT.md`).** Media
Library (Vercel Blob), content templates, admin search, and a live Settings screen are all built on
top of the full CRUD from Phase 4. The public site now reads identity/contact fields (name, role,
tagline, email, social links, resume path, "Currently Learning") from the database via
`lib/db/queries/settings.ts`, with the original static `lib/site-config.ts` values as a runtime
fallback. Production builds run in strict-data mode and may not use that fallback. Everything
the CMS brief originally asked for now exists in some form; `docs/PHASE_5_REPORT.md` §5 lists
what's still a deliberate simplification rather than a gap. Two real build blockers reported from
the owner's local environment after Phase 5 — a Prisma JSON type error and an Auth.js/Jose Edge
Runtime warning — were fixed in the baseline repair pass; see §3 and §5.1 for that design. A further
round of real local use then surfaced an editor/type/validator/renderer contract mismatch that broke
autosave, plus a set of admin UX/reliability gaps (silent failures, invalid nested delete forms, no
bulk delete, no loading/error boundaries) — all fixed in the pre-Phase-6 stabilization pass; see §4
(rendering pipeline), §5 (database design, JSON boundary), and §7 rules 10–12 for the current design
of the pieces that pass touched.

## 1. Overall architecture

```
                    ┌───────────────────────┐
                    │   Public Website       │  Server Components, mostly static
                    │   app/(public pages)   │  generation + on-demand ISR (target)
                    └───────────┬────────────┘
                                │ read-only
                    ┌───────────▼────────────┐
                    │   lib/content.ts        │  Compatibility seam backed by
                    │   (the seam)            │  lib/db/queries/*; MDX remains
                    │                         │  seed/recovery input only
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

The CMS database is the runtime source of truth. MDX/static arrays remain seed and recovery
inputs only.

## 2. Content flow

```
Postgres (Project, Lab, Article, Certificate, TimelineEntry, Skill, Tag, Category, Download tables)
  → lib/db/queries/* (only files that import Prisma — one module per content type)
  → lib/content.ts (Projects/Labs/Articles — same function names as the original MDX version)
    + direct query-layer calls (Certificates/Timeline/Skills — these never had a lib/content.ts
      wrapper even in the MDX era, since they were always structured data, not markdown files)
  → every public page
```

Content (Projects/Labs/Articles and optional Certificate write-ups) is TipTap JSON, rendered by
`components/shared/content-renderer.tsx` — see §4 for why that's a plain recursive function
rather than a live TipTap editor instance in read-only mode. Public reads use
`lib/db/read-policy.ts`: normal runtime may return a documented safe fallback, but
`STRICT_BUILD_DATA=1` throws after any applicable bounded retry. `npm run build` always sets this
flag and first runs `verify:build-data`, so a database failure cannot silently publish empty
static pages.

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
- **`app/admin/(dashboard)/layout.tsx` declares `export const dynamic = "force-dynamic"`** — added
  during the pre-Phase-6 stabilization pass after a real `npm run build` crashed: Next.js was
  attempting to statically prerender every `/admin/*` route at build time despite `requireAdmin()`'s
  `cookies()` usage, and since the admin data-fetching functions deliberately throw rather than fail
  open on a DB error (unlike the public `queries/*` functions — see §5), a build-time DB outage took
  the whole build down with it. This declaration makes the segment's already-true dynamic-only
  nature explicit and removes any ambiguity Next.js's automatic detection apparently had for this
  route shape.
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
  (`types/tiptap.ts` + `lib/validations/content.ts`), not from sharing a runtime instance — and
  that guarantee is only as good as the contract actually being kept in sync with what the editor's
  underlying library really produces. It genuinely drifted once already: the pre-Phase-6
  stabilization pass (`docs/PRE_PHASE_6_STABILIZATION_REPORT.md`) found the installed
  `@tiptap/starter-kit@3.x` doesn't match what the original contract's authors assumed —
  `codeBlock`'s `language` attribute defaults to `null`, not a string, so every toolbar-created code
  block failed validation. `npm run validate:editor-content` (`scripts/validate-editor-content.ts`)
  exists specifically so this class of drift is caught by a repeatable check instead of a support
  report — run it after any TipTap version bump or toolbar change, before assuming the contract
  still holds.
- **The admin editor (Phase 4, real as of this phase):** `components/editor/editor-shell.tsx`
  wraps `@tiptap/react`'s `useEditor`, configured by `lib/editor/extensions.ts`. Standard rich
  text (bold/italic/code/link, headings, lists, blockquote, horizontal rule, hard break, undo/redo)
  comes from `@tiptap/starter-kit`; tables and task lists from official `@tiptap/extension-*`
  packages, configured so their JSON output matches the schema exactly
  (`table`/`tableRow`/`tableCell`, `taskList`/`taskItem`). `StarterKit.configure()` explicitly sets
  `link: false`/`underline: false`/`strike: false` — StarterKit v3 bundles all three by default,
  which both duplicated this project's own separately-configured `Link` (a real
  `[tiptap warn]: Duplicate extension names found` at runtime) and made two marks
  (`underline`/`strike`) reachable via their default keyboard shortcuts with no toolbar button and
  no schema support for either. The 3 blocks with no official TipTap equivalent — `Callout`,
  `CommandBlock`, `Mermaid` — are hand-written `Node` extensions under `lib/editor/extensions/`,
  each with a React `NodeView` (via `ReactNodeViewRenderer`) that reuses the *exact* display
  component `ContentRenderer` uses for the same node type, so what you see while editing is what
  renders on the public page. A toolbar (`components/editor/toolbar.tsx`) is the primary way to
  insert/format content — no slash-command menu or drag-and-drop reordering yet; see
  `docs/PHASE_4_REPORT.md` §4 for that scope decision. **Rule going forward: every enabled toolbar
  button/keyboard shortcut must have a matching type in `types/tiptap.ts`, a matching Zod case in
  `lib/validations/content.ts`, a matching render case in `content-renderer.tsx`, and a fixture in
  `scripts/validate-editor-content.ts`. Anything the editor can produce but this triple doesn't
  cover is a shipped bug, not a future cleanup item — see the stabilization report for what it looks
  like when this rule isn't followed.**
- **Autosave and the Server Action serialization boundary:** ProseMirror deliberately creates
  node/mark attribute dictionaries with a `null` prototype. `editor.getJSON()` therefore returns
  JSON-shaped data that React will reject if it is passed directly to a Server Action.
  `lib/editor/serialize-content.ts` is the one client boundary: it rejects cycles, accessors,
  `undefined`, symbols, functions, non-finite numbers, and library/browser class instances; copies
  plain and null-prototype dictionaries into normal object literals; validates the complete TipTap
  contract; and asserts normal prototypes before returning. Valid Link and ordered-list attributes
  are modeled and preserved. The only content argument sent to an action is
  `{ id, content, clientRevision }`, constructed from primitives, arrays, and plain objects.
- **Revision and manual-save coordination:** `hooks/use-autosave.ts` assigns a monotonically
  increasing client revision to every editor change, permits one request in flight, queues edits
  made during a request, never retries an obsolete snapshot, and reports `Saved` only when the
  confirmed server revision equals the newest local revision. `Save changes` remains a metadata
  operation, but `hooks/use-editor-form-coordination.ts` first flushes the editor's newest revision
  and blocks metadata submission if that flush fails. Metadata and editor feedback remain separate
  and survive the Server Action's revalidation refresh. A `beforeunload` warning protects a known
  pending editor revision.
- **Save confirmation:** all four content actions validate `SaveContentPayload`, call
  `requireAdmin()`, write through the existing admin service, read the content back from PostgreSQL,
  compare it structurally, revalidate the required public routes, and return the structured
  `SaveResult` union from `types/admin.ts`. The UI cannot enter `Saved` on a thrown action, failed
  result, mismatched revision, failed database read-back, or metadata-only success.
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
- **Neon URL roles are explicit.** `DATABASE_URL` is the pooled `-pooler` endpoint used by Prisma
  Client; `DIRECT_URL` is the distinct unpooled endpoint used by Prisma schema/migration tooling.
  Both require SSL. `lib/db.ts` still creates one lazy global Prisma Client per Node process.
- **`Tag`/`Category`/`Skill` are shared taxonomy tables**, not per-content-type — `Tag` and
  `Skill` are many-to-many with every content type that uses them; `Category` is one-per-item,
  matching the current MDX frontmatter's cardinality exactly.
- **Published tag archives query relations directly.** `lib/db/queries/tags.ts` fetches the tag
  display name and only matching published Project/Lab/Article title/slug summaries. Static tag
  generation no longer loads every full collection once per tag.
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
  - **Activity Log** — `lib/db/queries/activity.ts` remains a typed, empty reserved seam. The
    dashboard deliberately does not present it as implemented. Its “Recently Updated Content”
    panel is derived only from real `updatedAt` columns and is labeled accordingly; it is not an
    audit trail. A real `ActivityLog` table remains a separately approved additive feature.
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
  serialize-content.ts      The only TipTap/ProseMirror-to-Server-Action conversion boundary.
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
6. **Public runtime reads may fail open; production build reads must fail closed.**
   `lib/db/read-policy.ts` is the shared policy boundary. It retries only confirmed transient,
   idempotent read failures (P1017/connection-closed signatures), at most three total attempts
   with short exponential backoff and jitter. Normal runtime may then return the caller's
   `[]`/`undefined`/Settings fallback. With `STRICT_BUILD_DATA=1`, the same exhausted or permanent
   error is rethrown. `npm run build` always enables strict mode and runs `verify:build-data`
   before `next build`; bypassing this wrapper for deployment is unsupported.
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
10. **Admin data-fetching functions fail *closed*, not open — the deliberate exception to rule 6.**
    `getAllProjectsForAdmin()` and its five siblings (`lib/services/*-admin-service.ts`) throw on a
    database error rather than returning `[]`. This is intentional and inverted from the public
    query layer on purpose: a visitor seeing an empty public page during a DB outage is a degraded
    experience; an admin seeing a false-empty project list during the same outage could read as "I
    have no projects" and lead to a panicked re-creation of real data. Because of this,
    `app/admin/(dashboard)/layout.tsx` declares `export const dynamic = "force-dynamic"` (see §3) —
    without it, Next.js's build-time static-generation pass can hit this same throw with no request
    context to catch it in, and take the whole `next build` down. Any new admin list/data function
    should keep this fail-closed behavior, not copy the public query layer's fail-open pattern.
11. **Every admin mutation Server Action returns a structured result — `ActionResult`,
    `AutosaveResult`, `DeleteResult`, or `BulkDeleteResult` (`types/admin.ts`) — never a bare throw.**
    `lib/services/action-errors.ts`'s `classifyServiceError()` is the one place Prisma error codes
    (P2002 duplicate, P2025 not found, P1xxx connection) get turned into a safe, specific,
    user-facing message; every action's catch block calls it rather than inventing its own message
    or letting the raw error reach the client. The same file's `isNextControlFlowError()` must be
    checked first in any catch block that wraps a call which might itself call `redirect()`/
    `notFound()` downstream — Next.js implements both via a thrown error, and swallowing it as an
    ordinary failure silently breaks the redirect instead of showing an error. Added during the
    pre-Phase-6 stabilization pass (`docs/PRE_PHASE_6_STABILIZATION_REPORT.md`) after autosave
    failures were surfacing as opaque, unstyled thrown errors with no way for the UI to distinguish
    "invalid content" from "database unreachable."
12. **A delete Server Action never redirects internally — the caller decides what happens next.**
    `deleteProjectAction(id)` and its siblings return a `DeleteResult` and stop; whether that's
    followed by `router.push()` (edit page) or `router.refresh()` (a management-list row) is a
    client-side decision made by `components/admin/delete-button.tsx`'s caller, not baked into the
    action. This is also why Delete is never a nested `<form>` inside a record's metadata form —
    nested forms are invalid HTML with inconsistent browser resolution, which was the actual
    reported cause of unreliable delete behavior before this pass. `DeleteButton`, row deletion,
    bulk deletion, and media deletion all compose
    `components/admin/delete-confirmation-dialog.tsx`, which uses the existing Radix Dialog
    primitive for focus trapping, Escape handling, focus restoration, pending lockout, and inline
    failure. Every action still calls `requireAdmin()`, validates its id(s), returns a structured
    result, and revalidates its affected routes. Bulk delete
    (`components/admin/management-list.tsx` + each service's `deleteXs(ids)`) follows the same
    result-returning shape and transactional service behavior.
13. **Loading boundaries match the destination route.** The admin segment keeps a dashboard-shaped
    root fallback, while list, rich editor, structured form, media, and Settings routes define
    small `loading.tsx` files that select the appropriate reusable skeleton. Public project, lab,
    journal, certification, and tag routes similarly choose list- or detail-shaped fallbacks.
    Layouts remain mounted, so navigation and the admin sidebar do not disappear. A client wrapper
    in the admin content area provides a two-pixel progress line immediately after internal link
    clicks; route Suspense remains the source of truth for actual loading. `error.tsx` remains a
    Client Component inside the admin layout and exposes safe Retry / Return to dashboard actions.
14. **Repeated identical public reads use React `cache()` only.** Collection, slug, Settings,
    Timeline, Skills, Certificate, and Tag query functions are request/render memoized by their
    arguments. There is no persistent data cache, so admin revalidation semantics are unchanged.
    Counts used during static generation follow the same request-only rule.
15. **Stored TipTap data is audited independently of editor fixtures.** `npm run audit:content`
    scans all non-null Project/Lab/Article/Certificate documents and prints bounded record/path/node
    diagnostics. `npm run migrate:content` is dry-run by default; `--write` backs up affected rows,
    validates deterministic normalization, and updates only affected records transactionally.
16. **Dashboard pages call one server-only service, not Prisma directly.**
    `lib/services/dashboard-service.ts` composes focused count, grouping, recent-record, attention,
    and health queries in parallel. Each panel is a typed success/failure section, so an optional
    panel can fail without becoming a fake zero or taking down successful panels. The dedicated
    `SELECT 1` health probe distinguishes Connected, Degraded, and Unavailable without exposing a
    database host. Metrics use counts/groupings rather than loading full collections, and Recently
    Updated is capped before merging.
17. **Mutation revalidation comes from one typed target matrix.**
    `lib/revalidation-targets.ts` declares the admin, collection, detail, tag, root-layout/search,
    settings-consumer, and sitemap surfaces for each content type.
    `lib/services/content-revalidation.ts` is the only service helper that executes those targets.
    Slug-changing updates supply both old and new slugs. The sitemap is a small dynamic,
    `no-store` XML route because live ISR testing showed that Next.js 14 retained stale output for
    the former metadata sitemap and for a force-static route even after `revalidatePath`.
18. **Publishing is manual.** Admin validation and forms expose Draft, Published, and Archived.
    Phase 6 migrated legacy Scheduled rows to Draft and cleared their scheduled timestamps. The
    Prisma enum/columns remain for migration compatibility, but the product does not claim a
    scheduler exists.
19. **The CMS showcase has a non-destructive seed.**
    `prisma/seed/cms-showcase.ts` creates the published showcase only when its stable slug is
    absent. A rerun never overwrites owner edits.

## 8. Migration roadmap (condensed — full detail in `docs/CMS_MIGRATION_PLAN.md`)

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Prisma + Neon schema, `lib/db.ts`, Auth.js foundation | ✅ Done |
| 1 | GitHub OAuth, middleware, `/admin` shell, dashboard, query/service/validation layers | ✅ Done |
| 2 | Migrate & cut over Projects only (seed script, `lib/content.ts` → Prisma for Projects, TipTap renderer) | ✅ Done |
| 3 | Same pattern for Labs, Articles, Certificates, Timeline, Skills; retire MDX | ✅ Done (this phase) |
| 4 | Admin CRUD + TipTap editor, autosave, publish workflow | ✅ Done — editor infrastructure + full CRUD for all 6 content types |
| 5 | Media Library (Blob), templates, admin search, Settings screen | ✅ Done |
| 6 | Cleanup, request caching, revalidation audit, dependency review, scheduling resolution, CMS showcase | ✅ Done |
