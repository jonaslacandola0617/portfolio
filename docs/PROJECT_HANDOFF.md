# Cyber Portfolio CMS — Master Project Handoff

**Handoff purpose:** Transfer long-term ownership of this repository to a new engineering agent without losing the original product intent, migration plan, architecture, completed work, constraints, or engineering history.

**Current repository state:** Phase 6 implemented and verified

**Current date of handoff:** July 28, 2026

**Immediate required task:** Preserve the Phase 6 strict build/data and revalidation guarantees

**Next planned milestone:** Ordinary iterative development and deployment hardening
**This is not a Phase 6-only instruction document.** It is the standing project context for every future task.

---

## 1. How the new owner should use this document

Treat this file as persistent project memory.

At the start of a new session:

1. Read this handoff.
2. Read the current `ARCHITECTURE.md`.
3. Read the latest phase report in `docs/`.
4. Inspect the actual source files relevant to the requested task.
5. Consult `docs/CMS_MIGRATION_PLAN.md` for the original migration intent and sequence.
6. Continue from the existing repository rather than proposing a replacement application.

After meaningful work:

1. Make the actual code changes.
2. Run the strongest verification the environment permits.
3. Update `ARCHITECTURE.md` when the system design or architectural rules change.
4. Create or update an implementation report under `docs/`.
5. Record limitations honestly.
6. Return the complete updated repository, preferably as a ZIP.

Do not use this handoff as an excuse to spend a full session producing another plan. Its purpose is to reduce rediscovery and preserve continuity so engineering can continue.

---

## 2. Source-of-truth hierarchy

When files disagree, use this order:

1. **Current source code**
2. **Latest implementation or phase report**
3. **Current `ARCHITECTURE.md`**
4. **This master handoff**
5. **Earlier phase reports**
6. **`docs/CMS_MIGRATION_PLAN.md`**

The migration plan began as a proposal written before implementation. It remains important because it records the intended transformation of the portfolio, but later reports and code document the actual implementation and deliberate deviations.

Never force the current code to match an outdated sentence merely for documentary consistency. Update stale documentation instead, unless the old document expresses a still-valid product requirement that was accidentally omitted.

---

## 3. Project identity and objective

This repository is a **personal cybersecurity and networking portfolio with a private CMS built into the same Next.js application**.

The public site showcases:

- Projects
- Networking and cybersecurity labs
- Journal or article entries
- Certifications
- Timeline milestones
- Skills
- Resume and contact information

The private `/admin` area allows the owner to manage the portfolio without manually writing and maintaining MDX files.

### Intended portfolio owner

The intended owner identity is **Jonas Lacandola**. Some original seed or fallback content may still contain demonstration values such as “Alex Rivera.” Do not silently assume placeholders are final personal data. Prefer editable Settings and clearly identified seed values.

### Product goal

The system should make it convenient to:

- Write and publish journals, labs, projects, and certificate write-ups.
- Manage structured portfolio metadata.
- Preserve the original public portfolio’s strong visual design.
- Avoid hand-editing raw MDX for ordinary updates.
- Keep public pages fast and resilient.
- Remain maintainable by one owner without enterprise-level complexity.

This is a personal documentation platform and portfolio CMS, not a multi-tenant publishing SaaS.

---

## 4. Owner priorities and decision style

These priorities should influence every future implementation decision.

### 4.1 Public UI fidelity is extremely important

The owner chose this repository specifically because its original public interface was substantially better than a later, more “advanced” greenfield CMS attempt.

Therefore:

- Preserve the existing public layout, typography, colors, cards, spacing, navigation, and visual identity.
- Do not replace it with a generic dashboard template or a different portfolio aesthetic.
- Do not redesign public pages unless the owner explicitly requests a redesign.
- New features should look native to the existing interface.

“Similar” is not sufficient when the task calls for retaining the existing design.

### 4.2 Authoring convenience matters more than architectural prestige

The owner wants journal, lab, and project entry to be convenient.

A simpler implementation that works well and preserves the UI is preferable to a theoretically superior architecture that:

- Delays useful features,
- Replaces proven design,
- Adds unnecessary abstractions,
- Or makes content entry harder.

Architecture should still be professional, secure, and maintainable, but do not overengineer a one-admin portfolio.

### 4.3 Continue the working repository

Do not restart because a different framework, auth provider, CMS, or component library might also work.

The approved stack and patterns are already implemented. Improve them incrementally.

### 4.4 Show real implementation, not another prototype

Future work should change the real application.

Do not respond to engineering tasks with only:

- A mockup,
- A static HTML prototype,
- A conceptual architecture,
- A new PRD,
- Or code snippets without updating the repository.

### 4.5 Be direct and honest

The owner prefers clear progress descriptions.

Do not exaggerate what was built or tested. Distinguish:

- Implemented,
- Compiled,
- Build-verified,
- Live HTTP-tested,
- Browser-tested,
- Credential-tested,
- And not yet verifiable.

---

## 5. Original migration objective

The original application stored content in:

```text
content/*.mdx
lib/data/*.ts
```

Public pages already consumed this data through a narrow seam:

```text
Public pages
  -> lib/content.ts or lib/data/*
  -> MDX files/static arrays
```

The CMS migration was designed as a controlled replacement behind that seam:

```text
Public pages
  -> lib/content.ts / lib/db/queries/*
  -> Prisma
  -> Neon PostgreSQL
```

The public routes and most presentational components were intentionally preserved.

The significant content-shape change was:

```text
Markdown/MDX string
  -> TipTap JSON
  -> server-side ContentRenderer
```

This allowed the owner to edit content in a browser while preserving the public website.

The migration plan should remain in the repository because it explains why the system was built this way and what each phase was meant to accomplish.

---

## 6. Migration roadmap and actual completion state

The migration was divided into stopping points where the public site should remain functional.

| Phase | Original scope | Actual status |
| --- | --- | --- |
| **0 — Foundations** | Prisma, Neon schema, DB client, Auth.js foundation | Complete |
| **1 — Auth and admin shell** | GitHub OAuth, middleware, protected admin layout, dashboard and architectural layers | Complete |
| **2 — Projects migration** | Seed and cut over Projects first, add TipTap JSON renderer | Complete |
| **3 — Full content migration** | Labs, Articles, Certificates, Timeline and Skills; retire MDX from runtime | Complete |
| **4 — Editor and CRUD** | TipTap editor, autosave, publish workflow and Projects CRUD | Complete |
| **4B — CRUD replication** | Apply CRUD pattern to Labs, Articles, Certificates, Timeline and Skills | Complete |
| **5 — CMS utilities** | Media Library, content templates, admin search and Settings | Complete |
| **6 — Cleanup and polish** | Caching, revalidation verification, cleanup and CMS showcase entry | Complete |

Phase 6 is complete, not the end of the project. Continue with deployment, usability fixes,
owner-requested enhancements, and carefully prioritized backlog items.

---

## 7. What each completed phase established

### Phase 0 — Prisma, Neon and Auth.js foundation

Established:

- `prisma/schema.prisma`
- Prisma client singleton in `lib/db.ts`
- Neon PostgreSQL as the intended database
- GitHub-based Auth.js foundation
- JWT sessions with no database adapter
- Environment variable documentation
- Initial relational design validation
- Stable distinction between publication state and real-world progress state

Important history:

- Prisma `6.19.3` was selected.
- The sandbox could not download Prisma engine binaries or reach Neon directly.
- A local PostgreSQL/manual SQL validation was used at the time.
- Real migrations still need a normal local or CI environment with network access.
- Auth.js v5 was chosen because its App Router APIs fit the project, despite being beta.

### Phase 1 — Authentication, admin shell and layers

Established:

- GitHub OAuth only
- One allow-listed admin email
- Middleware protection for `/admin/*`
- A second `requireAdmin()` guard in the protected admin layout
- Admin sidebar and dashboard
- Public/admin chrome separation
- Query, service and validation layer conventions
- Server Actions as the mutation default
- Typed seams for future features such as activity logs

Important implementation detail:

`lib/db.ts` uses lazy Prisma construction so a missing or ungenerated client fails inside query functions where it can be handled, not during module import and build-time page collection.

### Phase 2 — Projects moved to PostgreSQL

Established:

- Idempotent project seeding
- MDX-to-TipTap conversion
- Project query module
- `lib/content.ts` project delegation
- Database-backed public Project routes
- Server-side recursive TipTap renderer
- Fail-open read behavior so unavailable database reads degrade to empty content rather than crashing the build

The public Project UI was preserved.

### Phase 3 — Remaining public content migrated

Moved these runtime sources to PostgreSQL:

- Labs
- Journal Articles
- Certificates
- Timeline Entries
- Skills

Established:

- Full six-content-type seed process
- Project-to-Certificate seed reconciliation
- Stable identifiers for idempotent upserts
- Runtime retirement of MDX/static arrays
- `content/*.mdx` and `lib/data/*.ts` retained as seed/recovery inputs
- TipTap-aware reading-time calculation

MDX is no longer the normal public runtime pipeline. It remains part of the seed pipeline.

### Phase 4 — TipTap editor and Projects CRUD

Established:

- Shared editor shell
- Toolbar
- TipTap extension contract
- Callout custom node
- Command Block custom node
- Mermaid custom node
- Autosave and save status
- Project metadata form
- Project create, edit and delete flows
- Server Action authentication for mutations
- Revalidation after mutations

The editor was deliberately kept out of public display rendering. Public content uses a server-compatible recursive renderer instead of mounting a read-only ProseMirror editor.

### Phase 4B — Full CRUD replication

Added CRUD for:

- Labs
- Articles
- Certificates
- Timeline Entries
- Skills

Content-specific distinctions were preserved:

- Projects and Labs include domain progress state.
- Articles do not use real-world progress state.
- Certificates allow optional rich-text content.
- Timeline uses structured metadata and a description, not TipTap content.
- Skills are taxonomy and have no publication workflow.
- Timeline admin routes use database IDs because Timeline entries have no public slug.
- Project-to-Certificate linking remains seed-driven rather than editable in the UI.

### Phase 5 — Media, templates, search and Settings

Established:

- Vercel Blob Media Library
- Client-direct upload token route
- Server Action media-record creation
- Media listing, URL copy and delete
- Pre-structured templates for Projects, Labs and Articles
- Admin search across draft and published content
- Editable Site Settings
- Public Settings cutover for:
  - Name
  - Role
  - Tagline
  - Email
  - GitHub URL
  - LinkedIn URL
  - Resume URL
  - Currently Learning items
- Static fallback values when Settings cannot be read
- Upgrade from `next-auth` beta.31 to beta.32 after critical advisories were found

The Media Library is standalone. A content-form picker was not completed.

---

## 8. Current technology stack

Read `package.json` for the exact installed versions. At handoff time the central stack is:

### Application

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Radix UI primitives
- Framer Motion
- Lucide icons

### Data

- Neon PostgreSQL
- Prisma ORM
- Zod validation

### Authentication

- Auth.js / `next-auth` v5 beta
- GitHub OAuth
- JWT sessions
- Single allow-listed admin

### Editing

- TipTap
- ProseMirror through TipTap
- Custom Callout, Command Block and Mermaid nodes
- TipTap JSON persisted in PostgreSQL

### Media

- Vercel Blob
- Client-direct upload flow

### Deployment target

- Vercel
- Neon
- Vercel Blob

Do not replace these without explicit owner approval.

---

## 9. Current route model

### Public routes

Preserve these routes:

```text
/
about/
projects/
projects/[slug]/
labs/
labs/[slug]/
journal/
journal/[slug]/
certifications/
timeline/
skills/
resume/
contact/
tags/[tag]/
sitemap.xml
robots.txt
```

### Admin routes

The protected CMS lives under:

```text
/admin
/admin/login
/admin/projects
/admin/labs
/admin/journal
/admin/certificates
/admin/timeline
/admin/skills
/admin/media
/admin/settings
```

CRUD content types generally have:

```text
/admin/<type>
/admin/<type>/new
/admin/<type>/[id]
```

Do not rename established public routes for internal tidiness.

---

## 10. Current architecture

### 10.1 Public read flow

```text
PostgreSQL
  -> lib/db/queries/*
  -> lib/content.ts where a compatibility seam is useful
  -> public Server Components
  -> shared presentational components
```

Projects, Labs and Articles continue to expose familiar functions through `lib/content.ts`.

Certificates, Timeline and Skills can be consumed through their query modules because they were originally structured collections rather than MDX documents.

### 10.2 Admin mutation flow

```text
Admin form
  -> authenticated Server Action
  -> Zod validation
  -> admin service
  -> Prisma write
  -> path revalidation
  -> redirect or ActionResult
```

The precise import boundaries in the current code take precedence over older generalized architecture wording.

The intent is:

- Page components should not contain business logic.
- Client Components must never import Prisma.
- Runtime database access belongs in server-only query or service modules.
- Public read functions remain separate from admin all-status reads and mutations.
- Every exposed Server Action independently calls `requireAdmin()`.

### 10.3 Validation

Zod validates trust boundaries, including:

- Environment configuration
- Form input
- Media input
- TipTap JSON
- Seed output before database writes

Use one focused schema per domain or boundary.

Do not rely on TypeScript alone for external form data.

### 10.4 Resilience

Public reads share `lib/db/read-policy.ts`. At normal request time they may return safe fallbacks:

- Empty arrays
- `undefined`
- Or static Site Settings defaults

Production builds are deliberately different: `npm run build` runs `verify:build-data` and sets
`STRICT_BUILD_DATA=1`. Any permanent read failure, or a confirmed transient failure that remains
after three total attempts, is thrown so the build fails instead of publishing empty pages.
Retries apply only to idempotent reads and confirmed P1017/connection-closed signatures.

Do not apply fail-open behavior to authentication or authorization. Auth must fail closed.

### 10.5 Authentication

Authentication has defense in depth:

1. `middleware.ts` blocks unauthorized admin requests.
2. The protected admin layout calls `requireAdmin()`.
3. Each mutation Server Action calls `requireAdmin()` again.
4. GitHub sign-in only succeeds when the account email matches `ADMIN_EMAIL`.

Never assume that being rendered from a protected page makes a Server Action safe.

### 10.6 Public rendering

TipTap JSON is rendered by:

```text
components/shared/content-renderer.tsx
```

It is a recursive server-compatible renderer.

Do not replace it with a hydrated read-only editor unless there is a compelling measured reason. The current design preserves static generation and avoids shipping the editor runtime to readers.

### 10.7 Editor architecture

The editor uses:

```text
components/editor/editor-shell.tsx
components/editor/toolbar.tsx
lib/editor/extensions.ts
lib/editor/extensions/*
```

Custom editor NodeViews reuse the same visual components used by the public renderer where practical.

The JSON contract is shared through types and validation, not by sharing one browser editor instance with public rendering.

### 10.8 Seed architecture

The migration and recovery seed process lives in:

```text
prisma/seed/index.ts
prisma/seed/mdx-to-tiptap.ts
content/*.mdx
lib/data/*.ts
```

The seed must remain:

- Idempotent
- Zod-validated
- Keyed by stable identifiers
- Safe to rerun after a database reset

Stable keys include:

- `slug` for content and taxonomy with slugs
- `name` for Skills
- `(date, title)` for Timeline Entries

Do not remove `gray-matter`, `remark-*`, `unified`, or related seed dependencies while the seed pipeline imports them.

### 10.9 Media architecture

The browser uploads directly to Vercel Blob after receiving a short-lived token from:

```text
app/api/admin/media/upload/route.ts
```

After upload succeeds, the client calls an authenticated Server Action to create the Media database record.

This avoids routing large Packet Tracer, PCAP, video or image files through a serverless request-body limit.

Do not replace client-direct upload with a basic large-file Server Action.

### 10.10 Site Settings

`SiteSettings` is a singleton database record.

Public pages read editable identity and contact fields from the database, with `lib/site-config.ts` as a fallback.

Some lower-frequency values remain static:

- Current focus stack
- Home-page stat counters

Do not claim those are editable until corresponding schema and UI work exists.

---

## 11. Content model

### Project

Typical fields include:

- Title
- Slug
- Summary
- TipTap content
- Category
- Tags
- Skills or technologies
- Difficulty
- Real-world progress status
- Publication status
- Completion date
- Published/scheduled timestamps
- GitHub URL
- Thumbnail
- Downloads
- Related certificates

### Lab

Typical fields include:

- Title
- Slug
- Purpose
- TipTap content
- Category
- Tags
- Difficulty
- Progress status
- Publication status
- Lab date
- Published/scheduled timestamps

### Article / Journal

Typical fields include:

- Title
- Slug
- Summary
- TipTap content
- Category
- Tags
- Article date
- Publication status
- Published/scheduled timestamps

Articles intentionally do not use the same real-world progress field as Labs and Projects.

### Certificate

Typical fields include:

- Title
- Slug
- Issuer
- Progress label and percentage
- Start/completion dates
- Credential URL
- Logo
- Optional TipTap write-up
- Publication status
- Published/scheduled timestamps
- Related Projects

The UI for editing Project-to-Certificate relations is still missing.

### Timeline Entry

Structured fields include:

- Title
- Date
- Description
- Publication status
- Published/scheduled timestamps

Timeline has no content JSON and no public slug.

### Skill

Structured fields include:

- Name
- Group
- Level
- Related Projects

Skills are taxonomy, not independently publishable documents.

### Media

Media records represent uploaded files and metadata. One model supports multiple media types rather than separate image/file tables.

### Taxonomy

- Category is generally one-per-content-item.
- Tags are many-to-many.
- Skills are reusable taxonomy linked to content where relevant.

### Publication status versus progress status

These are intentionally separate.

- **Publication status:** Draft, Published, Archived. The database retains a legacy Scheduled enum
  value for migration compatibility, but it is not a supported UI workflow.
- **Progress status:** Planned, In Progress, Completed.

A public Lab may still be In Progress, so the two concepts must not be merged.

---

## 12. Editor behavior and intended writing experience

The editor should support professional documentation without requiring raw markup.

Implemented:

- Bold, italic and inline code
- Headings
- Paragraphs
- Bullet and ordered lists
- Task lists
- Blockquotes
- Horizontal rules
- Links
- Tables
- Code blocks
- Callouts
- Command Blocks
- Mermaid diagrams
- Autosave
- Save-state feedback
- Content-type templates

Templates currently provide document structure rather than blank editors.

Examples:

- Projects: Overview, Objectives, Technologies, Implementation and Lessons Learned.
- Labs: Purpose, Devices, Commands, Verification and Lessons Learned.
- Articles: Summary, Body and References.

Certificates intentionally begin with optional empty content.

Potential editor enhancements such as slash commands, drag-and-drop reordering and deeper syntax highlighting are not currently implemented and should not be represented as complete.

---

## 13. Non-negotiable engineering constraints

1. Do not restart the application.
2. Do not replace the public design without an explicit redesign request.
3. Do not replace the existing stack casually.
4. Do not rename established public routes.
5. Do not remove the CMS in favor of raw MDX.
6. Do not remove seed sources merely because runtime reads use PostgreSQL.
7. Do not add multi-user auth or registration without a real requirement.
8. Do not bypass `requireAdmin()` in Server Actions.
9. Do not expose credentials or commit real `.env` values.
10. Do not move database code into Client Components.
11. Do not conflate publication and progress status.
12. Do not claim browser, OAuth, Neon or Blob tests were completed when credentials or a browser were unavailable.
13. Do not return only conceptual snippets when asked to modify the application.
14. Do not silently change implementation decisions documented in the current architecture.
15. Do not overengineer this into an enterprise CMS.
16. Keep the repository buildable at meaningful stopping points.
17. Preserve idempotent seeding.
18. Update documentation when behavior changes.

---

## 14. Known document drift and conflicts

A new maintainer should not be confused by these existing inconsistencies.

### README drift

The current README still substantially describes the old MDX-driven portfolio.

It should eventually be updated to explain:

- PostgreSQL-backed runtime content
- Admin CMS
- GitHub OAuth
- TipTap
- Vercel Blob
- Seed/recovery MDX
- Setup, migrations and deployment

### Architecture historical wording

Some architecture text may still say that `lib/content.ts` currently reads `fs + gray-matter`.

That describes the original system, not the current Phase 5 runtime. Update the document rather than reverting the application.

### Media picker discrepancy

The original migration roadmap lists a Media picker as part of Phase 5.

What exists:

- Upload
- Browse
- Copy URL
- Delete

What does not exist:

- A reusable picker integrated into Project/Lab/Article/Certificate forms

### MDX dependency discrepancy

The original plan suggested removing MDX dependencies after runtime migration.

Current reality:

- Runtime MDX is retired.
- Seed-time MDX conversion still exists.
- Seed parser dependencies remain legitimate.

### Stale phase copy

Some code comments or UI text still mention future phases that are now complete.

Examples may include:

- “CRUD arrives in Phase 2”
- “Once Phase 4 ships”
- Vercel Blob described as not needed until Phase 5

Update stale copy during cleanup work.

### Architecture rule wording

Older rules may say only `lib/db/queries/*` imports Prisma.

Current admin services also perform server-side mutation access. Preserve secure boundaries, but describe the actual structure accurately rather than forcing mutations into public read modules.

---

## 14A. Owner-reproduced local build failure

The Phase 5 report recorded a successful build in Claude's sandbox. The owner subsequently ran
`npm run build` on the delivered Phase 5 source and reproduced a real local failure.

This newer local result overrides the older assumption that the Phase 5 baseline is build-clean.

The exact warning, TypeScript error, affected files, security constraints and acceptance checks
are recorded in:

```text
docs/REQUIRED_BASELINE_BUILD_REPAIR.md
```

Summary:

- `jose` emits `CompressionStream` and `DecompressionStream` warnings because the full Auth.js
  instance is imported into Next.js 14 Edge Middleware.
- Type checking fails because strict `TipTapDoc`/TipTap `JSONContent` values are passed directly
  into Prisma JSON fields that expect `Prisma.InputJsonValue`.
- The Prisma issue must be corrected at every TipTap JSON persistence boundary, not only the first
  reported `articleTemplate` line.
- The Auth warning must be removed without weakening the protected admin layout, authenticated
  Server Actions or GitHub allow-list.
- Baseline build repair is the new maintainer's first engineering task before Phase 6.

### Resolution update — July 28, 2026

The later real-data degradation is resolved in
`docs/CODEX_BUILD_DATA_STABILIZATION_REPORT.md`. Two legacy Article tables were backed up and
idempotently normalized from direct inline table-cell text to paragraph-wrapped block content.
All non-null database documents now pass `npm run audit:content`. Public reads now have bounded
P1017 retry plus strict build behavior, tag pages use direct tag-specific reads, and two
consecutive real-data builds completed without P1017 or content fallbacks.

## 15. Known current gaps and technical debt

These are known at handoff time.

### Completed consistency work

- The dashboard covers all six managed content types and uses a dedicated health probe.
- README and architecture documentation reflect the database-backed runtime.
- Public reads received a systematic request-cache pass.
- Mutation revalidation uses a verified typed matrix.
- The CMS itself is a published Project created by an idempotent seed.

### Scheduled publishing policy

No automatic scheduler exists. Phase 6 removed Scheduled from validation and admin forms, migrated
legacy Scheduled rows to Draft, and cleared scheduled timestamps. A future scheduler would be a
new, separately approved feature with authenticated promotion and route invalidation.

### Functional gaps

- Media picker in content forms
- Project-to-Certificate relation editor
- Editable current-focus stack
- Editable home-page stat counters
- Persistent Activity Log
- Revision history
- Advanced editor slash commands
- Block drag-and-drop
- More advanced code syntax highlighting

### Environment-dependent verification gaps

Previous Claude sandbox sessions lacked:

- Prisma engine download access
- Real Vercel Blob credentials
- A normal interactive browser
- GitHub OAuth credentials

Neon connectivity, real database counts, static builds, and local HTTP output were verified during
the July 28 build/data stabilization. OAuth and Blob operations remain credential/browser
dependent and were not exercised by that pass.

A new maintainer with local or CI access should run genuine end-to-end verification.

---

## 16. Completed work: Phase 6

Phase 6 was completed on July 28, 2026. The implementation and verification record is
`docs/PHASE_6_REPORT.md`. This handoff remains active after Phase 6.

Completed Phase 6 themes:

### 16.1 Caching

- Repeated public reads and counts use React request/render memoization.
- Existing strict error handling is preserved.
- No persistent application data cache was added.

### 16.2 Revalidation audit

Create, update, status change, delete, slug change, and Settings update use one typed target
matrix. Slug changes include old and new details; root-layout invalidation refreshes search data.
The sitemap is dynamic and `no-store` after live testing exposed stale Next.js 14 static sitemap
output.

Potentially affected surfaces include:

- Collection pages
- Detail pages
- Old and new slugs
- Home page
- Tags
- Search
- Sitemap
- Layout and Settings consumers

### 16.3 Cleanup

- README and architecture descriptions were corrected.
- Unused `framer-motion` and `@types/mdx` were removed.
- MDX/remark dependencies used by the recovery seed were retained.
- Dependency security was reviewed without forcing a framework-major upgrade.

### 16.4 Dashboard consistency

Completed in the immediately preceding dashboard polish pass and preserved by Phase 6.

### 16.5 CMS showcase Project

The published `Cybersecurity Portfolio CMS` Project is created by an idempotent seed that does not
overwrite an existing record.

### 16.6 Scheduled status resolution

Scheduled publishing was removed from product validation/forms. Legacy Scheduled records are
migrated to Draft because no secure scheduler exists.

### 16.7 Report

Completed.

Do not treat this list as a permanent prohibition against future priorities. The owner may request
different work. This section records the completed milestone and its design decisions.

---

## 17. Backlog priority after Phase 6

Unless the owner specifies a different priority, use this order.

### High value

1. Real local/production setup verification
2. Fixes discovered from using the CMS with real content
3. Media picker for Project thumbnails
4. Project-to-Certificate linking UI
5. Deployment hardening and setup documentation
6. Responsive and accessibility fixes that preserve design

### Medium value

1. Activity Log
2. Revision history
3. Better editor commands and code presentation
4. Additional Settings fields
5. Better media organization and selection

### Lower priority unless requested

1. Multi-user roles
2. Registration
3. Multi-tenant architecture
4. Replacing the editor
5. Framework or design-system rewrites
6. Public-site redesign

---

## 18. Development and verification workflow

### 18.1 Baseline inspection

Before modifying code:

```bash
npm ci
npm run db:generate
npx tsc --noEmit
npm run lint
npm run build
```

Some commands may require unrestricted access or environment variables.

Do not alter real secrets to make a build pass.

### 18.2 Database setup

Expected variables:

```text
DATABASE_URL
DIRECT_URL
```

Typical commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

Use migrations for controlled schema changes.

Keep seed writes idempotent.

### 18.3 Authentication setup

Expected variables:

```text
AUTH_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
ADMIN_EMAIL
```

GitHub OAuth callback:

```text
http://localhost:3000/api/auth/callback/github
```

Production callback must use the deployed domain.

### 18.4 Media setup

Expected variable:

```text
BLOB_READ_WRITE_TOKEN
```

Test:

- Token issuance
- Direct browser upload
- Media record creation
- Listing
- Copy URL
- Delete
- Auth rejection

### 18.5 Runtime testing

Where possible, test:

- Public routes
- Unauthenticated admin redirects
- Authenticated admin access
- CRUD for all six content types
- Autosave
- TipTap custom nodes
- Publishing and archiving
- Slug changes
- Settings propagation
- Seed reruns
- Database fallback behavior
- Blob upload
- Mobile and desktop UI

### 18.6 Security and dependency checks

Run:

```bash
npm audit --omit=dev
npm audit
```

Separate:

- Runtime vulnerabilities
- Development-only vulnerabilities
- Direct dependencies
- Transitive dependencies

Do not perform an uncontrolled framework-major upgrade just to reduce an audit count. Verify official advisories and regression-test any upgrade.

---

## 19. Architectural change protocol

A future maintainer may improve the architecture, but must preserve continuity.

Before a significant architecture change:

1. Identify the concrete problem.
2. Confirm the existing pattern cannot solve it cleanly.
3. Check public UI and route impact.
4. Check migration and rollback implications.
5. Preserve data.
6. Update `ARCHITECTURE.md`.
7. Explain the tradeoff in the implementation report.
8. Verify the full build.

Examples of significant changes:

- New table or schema relation
- Auth provider change
- Persistent caching layer
- Background scheduler
- Revision system
- Activity logging
- Media relation redesign
- Framework major upgrade

Do not conduct broad architectural debates when implementing a straightforward feature within established patterns.

---

## 20. Reporting standard

Every substantial phase or feature batch should have a report under `docs/`.

Suggested structure:

```text
# Phase or Feature Report

## Scope
## Files added
## Files modified
## Files removed
## Implementation
## Architectural decisions
## Bugs found and fixed
## Verification
## Security or dependency findings
## Environment limitations
## Remaining work
```

Reports are execution records, not promotional summaries.

Use exact command outcomes when possible.

Do not say “fully tested” if only TypeScript and a build were run.

---

## 21. Delivery standard

When work is performed in a chat or sandbox:

- Return the complete repository ZIP.
- Include updated documentation inside the ZIP.
- Include the implementation report.
- Do not return only a few changed files unless the platform makes a complete package impossible.
- Treat generated ZIPs or a real Git repository as the durable project record.
- Do not rely on an ephemeral working directory as the only copy.

The Phase 5 sandbox was reset mid-phase, and recovery was possible only because a complete prior ZIP existed in persistent storage. Future work should preserve durable checkpoints.

---

## 22. Communication and token-efficiency rules

The owner may have a limited Claude message allowance.

Use it efficiently:

- Read the repository before asking broad questions.
- Do not ask the owner to repeat documented decisions.
- Do not write long architecture proposals before ordinary implementation.
- Do not pause after every small file change for approval.
- Group related work into a coherent, verifiable increment.
- Give short progress updates.
- Surface real bugs early.
- Ask only when a missing product decision genuinely changes the implementation.
- Make conservative assumptions when the current architecture already provides a clear pattern.
- Finish and package the work in the same session when possible.

When a task is large, partial real implementation with an honest report is more useful than another plan with no code.

---

## 23. Files a new maintainer should inspect first

```text
PROJECT_HANDOFF.md
ARCHITECTURE.md
README.md
docs/CMS_MIGRATION_PLAN.md
docs/PHASE_0_REPORT.md
docs/PHASE_1_REPORT.md
docs/PHASE_2_REPORT.md
docs/PHASE_3_REPORT.md
docs/PHASE_4_REPORT.md
docs/PHASE_4B_REPORT.md
docs/PHASE_5_REPORT.md
docs/REQUIRED_BASELINE_BUILD_REPAIR.md
package.json
.env.example
prisma/schema.prisma
prisma/seed/index.ts
prisma/seed/mdx-to-tiptap.ts
lib/db.ts
lib/content.ts
lib/db/queries/*
lib/services/*
lib/validations/*
auth.ts
middleware.ts
app/admin/**
components/admin/*
components/editor/*
components/shared/content-renderer.tsx
lib/editor/*
lib/site-config.ts
content/README.md
```

Read additional files based on the requested task. Do not blindly rewrite all of them.

---

## 24. Definition of continuity

A replacement Claude has successfully taken over the project when it can:

- Explain why the public UI was preserved.
- Explain how runtime content differs from seed content.
- Identify all six CMS content types.
- Follow the query/service/action boundaries.
- Preserve GitHub allow-list authentication.
- Maintain TipTap JSON compatibility.
- Make idempotent schema/seed changes.
- Identify current gaps without claiming they are implemented.
- Continue from Phase 5 into Phase 6 or another owner-requested task.
- Update reports and architecture after implementation.
- Deliver a complete working repository.

The goal is not to imitate the previous Claude’s writing style. The goal is to continue its engineering decisions and project state without regression or unnecessary reinvention.
