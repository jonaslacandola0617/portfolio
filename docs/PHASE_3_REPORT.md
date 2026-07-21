# Phase 3 Report — Labs, Articles, Certificates, Timeline, Skills Migrated; MDX Retired

Scope (from `docs/CMS_MIGRATION_PLAN.md`'s roadmap): repeat Phase 2's pattern for the 5 remaining
content types, then retire the MDX rendering pipeline entirely. No admin CRUD, no TipTap editor UI
— still Phase 4.

## 1. Files changed

### New

```
lib/db/queries/timeline.ts           New — TimelineEntry had no query module before
lib/db/queries/skills.ts             New — groups Skill rows into the SkillCategory[] shape
content/README.md                    Documents content/*.mdx's new seed-only role
```

### Modified

| File | Change | Why |
| --- | --- | --- |
| `prisma/schema.prisma` | Added `Article.date`, `Certificate.slug` + `Certificate.logo` | Same class of gap as Phase 2's `Project.technologies`/`completionDate` — found by re-checking each remaining content type against its original type/data shape before writing the query layer, not assumed complete from Phase 0 |
| `prisma/seed/mdx-to-tiptap.ts` | Added GFM table support (`remark-gfm`) and `<Mermaid chart={...}>` JSX component support | Both real gaps — see §3, both would have silently dropped content without fixing |
| `types/tiptap.ts`, `lib/validations/content.ts`, `components/shared/content-renderer.tsx` | Added `table`/`tableRow`/`tableCell`/`tableHeader` node types throughout the schema/Zod/renderer | Required by the table fix above — the schema, validator, and renderer all needed to agree on the new node type |
| `lib/db/queries/labs.ts`, `articles.ts` | Extended from Phase 1's count-only stubs to real `getAllX`/`getXBySlug`/`getAllXSlugs`, following Phase 2's `projects.ts` pattern exactly | The planned cutover |
| `lib/db/queries/certificates.ts` | Extended from count-only to `getAllCertificates()` | Same |
| `lib/content.ts` | Lab/Article functions now delegate to the query layer and are `async` (same as Projects became in Phase 2). Cross-collection helpers simplified — all three sources are async now, no more mixed sync/async juggling | The planned cutover, now complete |
| `app/labs/page.tsx`, `app/labs/[slug]/page.tsx`, `app/journal/page.tsx`, `app/journal/[slug]/page.tsx` | `async`; `MdxContent` → `ContentRenderer` on the two detail pages | Same pattern as Phase 2's `app/projects/[slug]/page.tsx` |
| `app/certifications/page.tsx`, `app/timeline/page.tsx`, `app/skills/page.tsx` | Now call `lib/db/queries/{certificates,timeline,skills}.ts` instead of importing `lib/data/*.ts` directly; each has an empty-state for zero results | Cutover — these never had a `lib/content.ts` wrapper even pre-migration, so the change is at the page level directly |
| `app/projects/[slug]/page.tsx` | Certificate lookup now calls `getAllCertificates()` instead of importing the static array | Small ripple from certifications moving to Postgres |
| `app/page.tsx`, `app/sitemap.ts`, `app/tags/[tag]/page.tsx` | Remaining `getAllLabs()`/`getAllArticles()` call sites updated to `await` | Mechanical ripple, same as Phase 2 |
| `prisma/seed/index.ts` | Extended with `seedLabs`, `seedArticles`, `seedCertificates`, `seedTimeline`, `seedSkills`, and `reconcileProjectCertificates` | The full migration script — see §2 |
| `package.json` | Removed `next-mdx-remote`, `reading-time`, `rehype-slug`, `rehype-autolink-headings`, `rehype-pretty-code`, `shiki`; moved `gray-matter` and `remark-gfm` to devDependencies | MDX retirement — see §4 |
| `app/globals.css` | Removed dead `[data-rehype-pretty-code-*]` CSS rules | `CodeBlock` is self-styled and never relied on rehype-pretty-code's DOM structure; this styling had no effect once `ContentRenderer` replaced `MdxContent` everywhere |
| `lib/data/certifications.ts`, `timeline.ts`, `skills.ts` | Added a comment documenting their new seed-only role | Same treatment as `content/README.md` — nothing functionally changed, but leaving them undocumented would be misleading about whether they're still live |
| `ARCHITECTURE.md` | Updated throughout — status banner, content flow, rendering pipeline, database design, folder structure, roadmap table | Kept accurate to what's actually true post-Phase-3, not left describing Phase 2's in-between state |

### Removed

```
components/shared/mdx-content.tsx    Nothing imports it anymore (verified with grep before deleting)
```

## 2. The seed script, extended

`prisma/seed/index.ts` now seeds all 6 content types in one run, in dependency order:

```
seedProjects → seedLabs → seedArticles → seedSkills → seedCertificates
  → reconcileProjectCertificates → seedTimeline
```

`seedSkills` runs before `seedCertificates`/after `seedProjects` deliberately — Projects and
Certificates both `connectOrCreate` Skill rows as a side effect of their own seeding, but
`seedSkills` is what guarantees every skill in `lib/data/skills.ts` exists with correct
`group`/`level` even if no content item happens to reference it yet.

`reconcileProjectCertificates` is Phase 2's deferred TODO, done: it re-reads
`content/projects/*.mdx` for each file's `relatedCertification` field and connects the
already-created Project to the now-existing Certificate by matching against `Certificate.slug`.
Verified this produces exactly the 2 expected links — see §3.

Every upsert is keyed on a stable identifier (§7 of `ARCHITECTURE.md` has the full list per
content type) so the whole script is safe to re-run.

## 3. Build verification

`npx tsc --noEmit` — clean throughout. `npm audit`: 5 findings, down from 6 (removing
`next-mdx-remote` removed its high-severity advisory; the remaining 5 are the same
Next.js-major-version-bump-related findings tracked since Phase 0 — still deliberately deferred,
still a decision for you rather than something to bundle into a content-migration phase).

**Two real converter gaps found by testing against all 12 real files, not just the 4 already
proven in Phase 2:**

1. **Tables were silently dropped.** `mdx-to-tiptap.ts`'s `unified()` pipeline never had
   `remark-gfm`, so `|...|` table syntax parsed as plain paragraph text, not a `table` mdast node
   — GFM tables require that plugin to be recognized as tables at all. 2 of the 4 new articles
   use tables (`osi-vs-tcpip-model.mdx`, and `subnetting-cheat-sheet.mdx`'s CIDR reference table
   — arguably the most useful part of that article). Fixed by adding `remark-gfm` to the parser
   pipeline and `table`/`tableRow`/`tableCell` node types through the schema, Zod validator, and
   `ContentRenderer`. Verified: the converted table round-trips through real Postgres with all 8
   rows and correct header cells (`CIDR`, `Mask`, `Magic Number`, `Usable Hosts`) intact.
2. **One article uses `<Mermaid chart={...}>` as a JSX component, not a fenced code block.**
   Every other diagram in this project uses a ` ```mermaid ` fence; `dns-resolution-explained.mdx`
   uses the component form instead (both are legitimate ways `mdx-content.tsx` supported Mermaid
   originally). The converter only handled the fence form — the component form silently produced
   a console warning and dropped the diagram. Fixed by adding an explicit `<Mermaid>` case
   alongside `<Callout>`/`<CommandBlock>`.

Both were caught by actually running the converter against every real file and inspecting output
node types, not by reasoning about what MDX "should" contain — the same discipline as Phase 2's
schema-field checks, applied to the converter this time.

**End-to-end verification against real local Postgres** (same constraint as every prior phase —
`binaries.prisma.sh` still unreachable here, see the Phase 0 report):

- Seeded all 4 labs, all 4 articles (including both table-containing ones), all 4 certificates,
  all 10 timeline entries, all 18 skills, using the real converted TipTap JSON and real source
  data — not synthetic test fixtures.
- Read back the table-containing article: 8 rows, correct header cells, confirmed.
- Read back the Project↔Certificate join: both expected links present
  (`home-lab-network-segmentation ↔ ccna`, `wireshark-tcp-handshake-analysis ↔ google-cybersecurity`),
  matching the `relatedCertification` values in the original MDX frontmatter exactly.
- Confirmed skills grouped correctly by category (7 Networking, 6 Cybersecurity, 5 Programming —
  matches `lib/data/skills.ts`'s counts).

**Full build:**

```
✓ Compiled successfully
✓ Generating static pages (25/25)
```

25 rather than Phase 2's 53 — every content-detail route now returns 0 static params in this
sandbox (all 6 content types fail open to empty, not just Projects), exactly the same resilience
pattern as Phase 2, just now applying uniformly instead of to one content type. Confirmed live
(via `next start`) that this means clean empty states and 404s, not 500s, across every content
page — `/projects`, `/labs`, `/journal`, `/certifications`, `/timeline`, `/skills` all returned
200 with graceful empty content; detail-page requests 404'd cleanly; `/admin` remained protected;
`/about`, `/resume`, `/contact` (never touched by any phase) were unaffected throughout.

## 4. MDX retirement

Verified nothing referenced each piece before removing it (via `grep`, not assumption):

- `components/shared/mdx-content.tsx` — zero remaining imports, deleted.
- `next-mdx-remote`, `rehype-slug`, `rehype-autolink-headings`, `rehype-pretty-code`, `shiki`,
  `reading-time` — all only ever used by `mdx-content.tsx` or the old `lib/content.ts`
  file-reading path; removed from `package.json` entirely.
- `gray-matter`, `remark-gfm` — still needed, but only by `prisma/seed/`, which runs at
  migration time via `tsx`, never at request time. Moved from `dependencies` to
  `devDependencies` accordingly.
- `mermaid` (the npm package) stays a regular dependency — `MermaidDiagram` is still a runtime
  component, rendering diagrams client-side regardless of where the chart text came from.
- Dead CSS (`[data-rehype-pretty-code-*]` selectors in `globals.css`) removed — `CodeBlock` was
  always self-styled and never depended on that markup shape.

`content/*.mdx` and `lib/data/{certifications,timeline,skills}.ts` were **not** deleted — they're
`prisma/seed/index.ts`'s migration source and the reference to re-run against if the database is
ever reset. Both now have a comment/README explaining that role so a future reader doesn't mistake
them for live content.

## 5. Blockers before Phase 4

**Same one, fourth time:** `binaries.prisma.sh` unreachable in this sandbox. Once your Neon
credentials are in `.env.local`:

```bash
npm install          # postinstall runs `prisma generate`
npm run db:migrate     # applies the schema, including this phase's 3 new columns
npm run db:seed         # migrates all 12 MDX files + 3 data files into Postgres
```

After that, every public content page goes from the graceful empty-state you'd see right now to
the real migrated content.

**Nothing new blocking Phase 4.** With all 6 content types on the same query-layer/service-layer
pattern, Phase 4's CRUD screens and TipTap editor have one consistent shape to target across every
content type, not one proven pattern (Projects) and 5 unknowns.

Waiting for your approval before starting Phase 4.
