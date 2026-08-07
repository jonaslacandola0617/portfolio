# Phase 2 Report — Projects Migrated from MDX to Postgres

Scope (from `docs/CMS_MIGRATION_PLAN.md`'s roadmap, since this phase wasn't separately re-specified
before starting): migrate the 4 existing project MDX files into Postgres, cut `app/projects/**`
over to read from Prisma, leave Labs/Articles/Certificates/Timeline/Skills on MDX/static arrays
until Phase 3. No admin CRUD, no TipTap editor UI — those are Phase 4.

## 1. Files changed

### New

```
types/tiptap.ts                    TipTap JSON schema — plain types, no @tiptap/* dependency
lib/validations/content.ts          Zod mirror of types/tiptap.ts
lib/reading-time.ts                 Reading-time estimator for TipTap JSON (reading-time npm
                                     package only understands markdown strings)
components/shared/content-renderer.tsx   Read-only TipTap JSON → React renderer

prisma/seed/mdx-to-tiptap.ts         MDX → TipTap JSON converter (mdast-based)
prisma/seed/index.ts                 The seed script (npm run db:seed)
```

### Modified

| File | Change | Why |
| --- | --- | --- |
| `prisma/schema.prisma` | Added `Project.technologies String[]` and `Project.completionDate DateTime`; removed nothing | Both fields exist in the original `ProjectFrontmatter` type but were missing from the Phase 0 schema — caught by re-verifying the schema against the type contract before writing the seed script, not guessed at |
| `lib/db/queries/projects.ts` | Real `getAllProjects`/`getProjectBySlug`/`getAllProjectSlugs` replace the count-only stub; every function now catches its own Prisma errors and fails open | See §3 — this isn't optional polish, the build crashed without it |
| `lib/db.ts` | *No further change this phase* — the Phase 1 lazy-Proxy fix already covers this correctly; confirmed by testing, not assumed |
| `lib/content.ts` | Project functions (`getAllProjects`, `getProjectBySlug`, `getAllProjectSlugs`) now delegate to `lib/db/queries/projects.ts` and are `async`. Lab/Article functions unchanged. `getAllTags`/`getSearchIndex` are now `async` (they aggregate across an async source and two sync ones) | The planned cutover — same exported names, same call shape apart from the unavoidable async ripple |
| `types/index.ts` | Added `DbContentItem<T>` (Prisma-backed content, `content: unknown`) alongside the existing `ContentItem<T>` (MDX-backed, unchanged); removed `featured?: boolean` from `ProjectFrontmatter` | Verified via `grep` that `featured` was never read anywhere before removing it — dead frontmatter data, not a used feature |
| `app/projects/[slug]/page.tsx` | `MdxContent` → `ContentRenderer`; `generateStaticParams`/`generateMetadata`/the page itself all became `async` | The one real page-level change this phase — everything else on the page (layout, sidebar, TOC, related content) is untouched |
| `app/projects/page.tsx` | `async`, updated the empty-state copy (it referenced adding an `.mdx` file, which is no longer how Projects work) | Small but real — stale copy would have been actively misleading |
| `app/page.tsx`, `app/layout.tsx`, `app/tags/[tag]/page.tsx`, `app/sitemap.ts` | All became `async` (or their relevant export did) to `await` the now-async Project functions | Mechanical ripple from `lib/content.ts`'s Project functions becoming async — no logic changes |
| `package.json` | Added `remark-parse`, `remark-mdx`, `tsx` (devDependencies — seed-script-only, not runtime); added `db:seed` script and a `prisma.seed` config entry | Needed to parse MDX into an AST outside of Next's own MDX pipeline, and to run the seed script |

### Confirmed untouched

Every file under `components/ui/`, `components/layout/`, `components/admin/`, and every
still-MDX-backed page (`app/labs/**`, `app/journal/**`, `app/certifications/**`,
`app/timeline/**`, `app/skills/**`). `components/shared/mdx-content.tsx` itself is untouched and
still in active use — Labs and Articles render through it exactly as before.

## 2. Architecture decisions

**Direct mdast → TipTap-JSON mapping, not the HTML-bridge originally sketched.**
`docs/CMS_MIGRATION_PLAN.md` §5 proposed converting MDX → HTML → `generateJSON()` via
`@tiptap/html`. I didn't build it that way. The 4 files being migrated use a small, fully-known
set of constructs (headings, paragraphs, lists, code fences, `<Callout>`, `<CommandBlock>`) — a
direct `remark-parse`/`remark-mdx` AST walk covers all of it without installing `@tiptap/html` or
needing a real TipTap extension schema to exist (Phase 4 still doesn't have one). Verified against
all 4 real files, not just the shape in the abstract — see §3.

**No `@tiptap/*` packages installed this phase.** `content-renderer.tsx` is a plain recursive
function matching on `node.type`, not a live TipTap `Editor` instance in `editable: false` mode.
ProseMirror's `EditorView` is DOM-dependent and isn't a natural fit for `generateStaticParams` —
using it would mean either losing static generation for project pages, or hydrating a full editor
just to display text. `ARCHITECTURE.md` originally described editor/renderer parity as "the same
extension config"; I refined that to "the same JSON schema contract" (`types/tiptap.ts` +
`lib/validations/content.ts`) once it became concrete which mechanism the renderer would actually
use. Updated `ARCHITECTURE.md` to say this precisely rather than leave the original, more
optimistic description standing.

**`DbContentItem<T>` is a new type, not a change to `ContentItem<T>`.** Projects now return
`content: unknown` (TipTap JSON, validated at the renderer); Labs/Articles still return
`content: string` (markdown). Widening the shared `ContentItem<T>` to accommodate both would have
put type friction on the still-MDX code paths for no benefit — Labs/Articles didn't need to know
anything changed, and now they don't.

**Two schema fields added this phase** (`technologies`, `completionDate`) that should have been
in Phase 0's schema. Found by deliberately re-checking the schema against the original
`ProjectFrontmatter` type field-by-field before writing the mapping function, rather than trusting
the earlier review was exhaustive. Also removed `featured?: boolean` — present in the original
type and in 2 of the 4 MDX files' frontmatter, but never read by any component (confirmed with
`grep`, not assumed) — carried-over dead data, not a feature this migration owed backward
compatibility to.

**Query layer fails open, not closed** — the significant finding this phase, covered in full in
§3. Documented as new architectural rule #6 in `ARCHITECTURE.md`.

## 3. Build verification

`npx tsc --noEmit` — clean throughout, including through two real bugs found only by actually
building (types alone didn't catch either one, because both involve values that are only wrong at
runtime, not at the type level).

**Bug found: query functions threw instead of degrading, even with `lib/db.ts`'s Phase 1 fix in
place.** `generateStaticParams` in `app/projects/[slug]/page.tsx` calls `getAllProjectSlugs()`
directly, with no try/catch of its own — reasonably so, since catching-at-every-call-site isn't a
pattern worth repeating 6+ times across pages, the sitemap, and the tags page. First build attempt
failed: `Error: @prisma/client did not initialize yet`, thrown from inside
`getAllProjectSlugs()`, uncaught, taking down the whole build during static params collection —
same failure mode as the Phase 1 dashboard bug, different call site. Fixed at the query layer
instead of per-page: every function in `lib/db/queries/projects.ts` now catches its own Prisma
error and returns `[]`/`undefined`. This is the layer that should own this concern — every current
and future caller (pages, `generateStaticParams`, the sitemap, the tags page) gets safe behavior
automatically, without remembering to wrap each call site. Documented as `ARCHITECTURE.md` rule
#6.

**Full build, after the fix:**

```
✓ Compiled successfully
✓ Generating static pages (53/53)
```

53 rather than the previous 56 — expected and correct: `getAllProjectSlugs()` genuinely returns
`[]` in this sandbox (no reachable database), so zero project pages are statically pre-rendered
at build time. The route still exists; Next's default `dynamicParams: true` means any real slug
renders on-demand once the database has data. Confirmed live (below) that this produces a clean
404, not a crash, for a project slug requested against an empty/unreachable database — and that
every Labs/Journal/Timeline/Skills page (still MDX/static-array-backed, entirely unaffected by
this phase) continued rendering normally throughout.

**Live verification** (`next start`, real HTTP requests):

```
GET /                              200  (still MDX-driven, unaffected)
GET /labs/vlan-trunking-lab        200  (still MDX-driven, unaffected)
GET /journal/subnetting-cheat-sheet 200  (still MDX-driven, unaffected)
GET /timeline                       200  (still MDX-driven, unaffected)
GET /skills                          200  (still MDX-driven, unaffected)

GET /projects                        200, body contains "No published projects yet"
GET /projects/home-lab-network-segmentation   404 (not 500 — graceful, via notFound())

GET /admin                            307 → /admin/login  (still protected, unaffected)
```

**End-to-end data-shape verification, independent of the blocked Prisma CLI.** Same constraint as
Phase 0/1 — `binaries.prisma.sh` is still unreachable here (see the Phase 0 report), so
`prisma generate`/`migrate`/the real seed script can't run in this sandbox. Rather than stop at
"this should work," I:

1. Ran the actual `mdxBodyToTipTapDoc()` converter against all 4 real project files. All 4
   produced Zod-valid TipTap documents; spot-checked the output in detail (marks, nested callout
   content, command arrays extracted from JSX expression attributes) rather than only checking
   `success: true`.
2. Wrote the equivalent of the seed script's writes as raw SQL against the local Postgres
   instance from Phase 0 (temporary, not part of this delivery — removed before packaging), using
   the *real* converted JSON from step 1.
3. Read it back with the same shape `lib/db/queries/projects.ts`'s `mapProject()` produces, and
   compared it to the original MDX frontmatter field-by-field. Exact match — title, category,
   difficulty, status, tags, technologies, skills, estimatedTime, completionDate, downloads, all
   correct, across a full write/read round-trip through real Postgres.

This is real evidence the pipeline is correct, not just internally consistent. The one piece that
couldn't be verified this way is `prisma.project.upsert()` itself, since that requires the actual
generated Prisma Client — but the query shape, the data shape, and the conversion logic are all
proven against real Postgres and real source files.

## 4. Blockers before Phase 3

**Still the same one, carried over again:** `binaries.prisma.sh` unreachable in this sandbox, so
the real `prisma generate` / `prisma migrate dev` / `npm run db:seed` need to run on your machine
or CI before Projects actually appear on a live deploy. Once your Neon `DATABASE_URL`/`DIRECT_URL`
are in `.env.local`:

```bash
npm install          # postinstall runs `prisma generate`
npm run db:migrate    # applies the schema, including this phase's 2 new Project columns
npm run db:seed        # migrates the 4 project MDX files into Postgres
```

After that, `/projects` and `/projects/[slug]` go from the graceful empty-state you'd see right
now to the real, migrated content — no further code changes needed; that's the whole point of
the fail-open design in §3.

**Nothing new blocking Phase 3.** The pattern (query layer function per content type, `lib/
content.ts` delegation, fail-open error handling, `ContentRenderer` reuse) is proven on Projects
and ready to repeat for Labs, Articles, Certificates, Timeline, and Skills.

Waiting for your approval before starting Phase 3.
