# Codex Project Takeover — Cyber Portfolio CMS

**Purpose:** Transfer active engineering ownership of the existing Cyber Portfolio CMS to Codex.  
**Project state:** Phase 5 implementation, baseline build repair, and a pre–Phase 6 stabilization pass have been delivered, but the owner's real local build still exposes unresolved data-validation and database-connection failures.  
**Immediate priority:** Diagnose and repair the degraded production build before Phase 6.  
**Long-term responsibility:** Continue maintaining and extending the same repository after this repair.

This is an existing application. Do not create a replacement project, new prototype, or alternative frontend.

---

## 1. Start here

Before editing anything, read:

1. `PROJECT_HANDOFF.md`
2. `ARCHITECTURE.md`
3. `docs/CMS_MIGRATION_PLAN.md`
4. `docs/BASELINE_BUILD_REPAIR_REPORT.md`
5. `docs/PRE_PHASE_6_STABILIZATION_REPORT.md`
6. `docs/PRE_PHASE_6_STABILIZATION_BRIEF.md`
7. The attached build log, if it is not already under `docs/debug/`
8. The source files listed in this handoff

The source code and current database behavior take precedence over reports that claim a feature is complete.

The latest stabilization report says the build and editor contract were fixed, but the owner’s actual local build produced large TipTap validation errors and repeated Prisma `P1017` connection resets. Treat the real local result as authoritative.

---

## 2. Codex operating rules

### Repository safety

Before making changes:

```bash
git status --short --branch
git log --oneline --decorate -10
node --version
npm --version
```

Then:

- Preserve all existing uncommitted work.
- Never run `git reset --hard`, `git clean -fd`, destructive checkout commands, or rewrite history.
- Do not discard a file merely because it differs from an older report.
- Do not commit automatically unless the owner explicitly requests commits.
- Keep changes focused and reviewable.
- Do not expose or print `.env` values.
- Never include `.env`, `.next`, `node_modules`, or real credentials in a delivered archive.

The owner’s RAR archive contains a real `.env` file. Do not copy it into documentation or output. Use it locally without displaying its contents.

### Implementation behavior

- Reproduce each failure before changing code.
- Do not stop after an audit or proposal.
- Implement the repair in the actual repository.
- Do not hide failures with warning suppression, broad `try/catch`, `z.any()`, or unconditional empty fallbacks.
- Keep the current public design and routes unchanged.
- Preserve the current stack and architectural boundaries.
- Update documentation after the code is verified.
- Distinguish build success from correct data generation.

---

## 3. Project context

This is a personal cybersecurity and networking portfolio converted from file-based MDX/static arrays into a private database-backed CMS.

### Current stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS and existing UI primitives
- Prisma 6
- Neon PostgreSQL
- Auth.js / `next-auth` v5 beta with GitHub OAuth
- Single allow-listed admin email
- TipTap JSON editor
- Vercel Blob
- Zod

### Content types

The CMS manages:

1. Projects
2. Labs
3. Journal Articles
4. Certificates
5. Timeline Entries
6. Skills

Projects, Labs, Articles, and optional Certificate write-ups store TipTap JSON.

### Important product constraints

- Preserve the existing public portfolio UI exactly unless the owner requests redesign.
- Continue the existing CMS; do not return to raw-MDX authoring.
- Keep GitHub allow-list authentication.
- Keep public routes stable.
- Keep seed operations idempotent.
- Keep Server Actions authenticated.
- Do not turn this into a multi-user or multi-tenant CMS.
- Authoring convenience is more important than unnecessary architectural complexity.

---

## 4. Immediate problem: the build exits successfully but is degraded

The owner’s build log shows two independent classes of failure.

### Failure A — TipTap content validation during static generation

The log contains a very large Zod `invalid_union` tree while static pages are being generated.

Paths include deeply nested content such as:

```text
content.10
content.10.content.7.content.2
content.10.content.7.content.3
```

The errors mention expected or mismatched nodes including:

```text
heading
paragraph
blockquote
horizontalRule
bulletList
orderedList
listItem
taskList
taskItem
codeBlock
callout
commandBlock
mermaid
table
tableRow
tableCell
tableHeader
```

The public renderer catches the validation failure and returns a fallback paragraph. Because it does not throw, Next.js continues building.

A successful exit code therefore does not prove that content rendered correctly.

### Failure B — Prisma `P1017` during static generation

The log repeatedly contains:

```text
Server has closed the connection.
P1017
An existing connection was forcibly closed by the remote host.
```

Affected reads include at least:

```text
prisma.project.findMany()
prisma.article.findMany()
```

The query modules catch these errors and return empty arrays, allowing static generation to continue.

This can silently produce:

- Empty Projects, Labs, or Journal listings
- Missing static detail routes
- Incorrect tag pages or tag 404s
- Incomplete search data
- Incomplete sitemap data
- A deployable but factually incomplete build artifact

Do not call the build clean until both failure classes are eliminated and generated content is verified.

---

## 5. First task: establish a trustworthy baseline

### 5.1 Capture the environment without secrets

Record:

```bash
node --version
npm --version
npx prisma --version
git status --short --branch
```

Inspect the presence and format—not the values—of:

```text
DATABASE_URL
DIRECT_URL
AUTH_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
ADMIN_EMAIL
BLOB_READ_WRITE_TOKEN
```

For the database URLs, programmatically report only safe metadata such as:

- Host suffix or whether it appears to be a pooled Neon endpoint
- Whether SSL parameters are present
- Whether `DATABASE_URL` and `DIRECT_URL` are different

Never print usernames, passwords, complete URLs, or query tokens.

### 5.2 Reproduce in a fresh process

Run:

```bash
npm ci
npm run db:generate
npm run validate:editor-content
npx tsc --noEmit
npm run lint
npm run build
```

Capture the complete build log to a file under:

```text
docs/debug/
```

Do not modify code until the failure has been reproduced or the environmental reason for non-reproduction is documented.

### 5.3 Record expected data counts

Before the build, query and record counts for:

- Published Projects
- Published Labs
- Published Articles
- Published Certificates
- Timeline Entries
- Skills
- Tags
- Site Settings

These expected counts will later be compared with the generated site and search/sitemap output.

---

# Part I — Diagnose and repair TipTap content validation

## 6. Do not assume the exact root cause

The prior stabilization pass updated the editor contract and added fixtures. Those fixtures may prove that newly generated example documents validate, but they do not prove that every existing PostgreSQL record matches the new contract.

Possible causes include:

1. Legacy database records written before the contract repair
2. Seed-converted content with a different shape
3. A node or attribute still missing from the Zod schema
4. Validation stripping or transforming valid attributes
5. A renderer/schema mismatch
6. A record containing malformed JSON unrelated to TipTap
7. The report claiming a fix that was not applied to the exact repository being built

Determine the actual cause from record-level evidence.

## 7. Inspect these files first

```text
types/tiptap.ts
lib/validations/content.ts
components/shared/content-renderer.tsx
lib/editor/extensions.ts
lib/editor/extensions/*
components/editor/editor-shell.tsx
components/editor/toolbar.tsx
scripts/validate-editor-content.ts
prisma/seed/mdx-to-tiptap.ts
prisma/seed/index.ts
lib/prisma-json.ts
lib/reading-time.ts
lib/db/queries/projects.ts
lib/db/queries/labs.ts
lib/db/queries/articles.ts
lib/db/queries/certificates.ts
```

Compare the configured TipTap extensions with:

- TypeScript node and mark unions
- Zod schemas
- JSON emitted by the actual installed TipTap version
- Seed converter output
- Existing database JSON
- Public renderer cases

## 8. Add a database content-audit command

Create a repeatable command, for example:

```bash
npm run audit:content
```

It must scan every non-null TipTap document in:

- Projects
- Labs
- Articles
- Certificates

For each invalid record, output a compact diagnostic:

```text
Model: Project
ID: <id>
Slug: <slug>
Title: <title>
Path: content.10.content.7.content.2
Nearest node type: tableCell
Reason: expected block content
```

Requirements:

- Do not print the entire Zod union tree.
- Limit node previews to a safe, readable size.
- Include a final summary by model.
- Exit nonzero if invalid records exist.
- Exit nonzero if the database cannot be audited.
- Do not modify data in audit mode.

Add representative database-derived fixtures to the editor-validation script when a previously unmodeled valid shape is discovered.

## 9. Improve validation diagnostics

Create a reusable formatter for Zod content issues.

The public renderer should log useful context rather than:

```text
Invalid TipTap document: [hundreds of union errors]
```

Pass or derive context such as:

- Content type
- Record id
- Slug
- Title
- First meaningful issue path
- Nearest node type
- Short reason

Do not expose complete document bodies in production logs.

The visible public fallback can remain user-safe, but the server log must identify the record.

## 10. Decide whether this is a schema repair or data migration

### If the stored JSON is valid TipTap output

Update the strict contract consistently across:

```text
types/tiptap.ts
lib/validations/content.ts
components/shared/content-renderer.tsx
scripts/validate-editor-content.ts
prisma/seed/mdx-to-tiptap.ts
```

Do not weaken the contract to `unknown` or `z.any()`.

### If the stored JSON is legacy or malformed

Create a separate, explicit migration tool.

Suggested commands:

```bash
npm run migrate:content -- --dry-run
npm run migrate:content -- --write
```

Requirements:

- Dry-run is the default.
- Export/backup the affected records before writing.
- Print the proposed before/after shape in compact form.
- Use deterministic and idempotent normalization.
- Update only records that need normalization.
- Validate the normalized result before persistence.
- Use a transaction where practical.
- Never rerun the complete seed as a substitute.
- Never overwrite newer CMS edits with old MDX seed content.
- Run the audit again afterward and require zero invalid records.

Examples of possible normalizations must be based on evidence, not assumptions:

- Wrap direct table-cell inline content in paragraphs
- Normalize missing or nullable attributes
- Convert legacy list/task shapes
- Preserve text and marks
- Preserve custom-node content
- Reject ambiguous data instead of guessing destructively

## 11. Validate renderer parity

For every supported editor node and mark:

1. The editor can generate it.
2. The Zod contract accepts it.
3. Prisma can store it.
4. The public renderer handles it.
5. The reading-time extractor does not crash.
6. The seed converter either generates it correctly or deliberately cannot generate it.
7. Existing database records pass.

Run the editor fixtures and the database audit independently.

---

# Part II — Diagnose and repair Prisma `P1017`

## 12. Inspect the current database architecture

Read:

```text
lib/db.ts
lib/db/queries/*
lib/content.ts
app/sitemap.ts
app/layout.tsx
app/page.tsx
app/projects/**
app/labs/**
app/journal/**
app/tags/[tag]/page.tsx
hooks/use-search.tsx
```

Map every database read performed during:

- `generateStaticParams`
- `generateMetadata`
- Root layout rendering
- Home page rendering
- Search-index construction
- Sitemap generation
- Each tag page
- Collection pages
- Detail pages

Create a short query graph in the debugging report.

## 13. Investigate query multiplication

A confirmed high-cost path in the inspected source is the tag page:

```ts
const [allProjects, allLabs, allArticles] = await Promise.all([
  getAllProjects(),
  getAllLabs(),
  getAllArticles(),
]);
```

That runs for every generated tag page.

If there are many tags, this multiplies full collection reads across static generation.

Replace broad collection loading with a direct read designed for one tag, such as:

```text
getPublishedContentByTagSlug(tagSlug)
```

or model-specific tag queries that filter in PostgreSQL.

Requirements:

- Preserve the current Tag page output and URL.
- Retrieve only published content.
- Preserve the original tag display name.
- Avoid three complete collection reads per generated tag.
- Add indexes only when justified by the Prisma schema and query plan.
- Update query/service boundaries consistently.

Audit other repeated static-generation reads before stopping at the tag page.

## 14. Verify Neon connection configuration safely

Check current official Neon and Prisma guidance for the exact installed versions.

Confirm:

- `DATABASE_URL` is appropriate for application queries and pooling.
- `DIRECT_URL` is appropriate for migrations/direct operations.
- Prisma schema uses the intended variables.
- SSL is configured correctly.
- No accidental localhost or obsolete host is used.
- The app is not constructing multiple Prisma clients unnecessarily.

Do not hardcode credentials or rewrite the URLs without explaining the change.

## 15. Add bounded retry only for safe transient reads

A small retry may be appropriate for idempotent reads when Prisma reports a confirmed transient connection closure.

Requirements:

- Retry only known transient codes or conditions, including `P1017` if confirmed.
- Do not retry validation, authorization, unique constraints, or permanent query errors.
- Maximum attempts must be small.
- Use short exponential backoff with jitter.
- Log attempt number and operation context.
- Do not allow unlimited retries.
- Do not apply automatic retry to non-idempotent writes unless carefully designed.

Prefer one reusable server-only helper over repeated retry loops.

A retry is not a substitute for reducing query volume or correcting connection configuration.

## 16. Separate runtime resilience from build correctness

The original architecture intentionally lets public queries return empty data when PostgreSQL is unavailable so a page does not always crash.

That behavior is unsafe during a production build because it can publish empty pages.

Implement an explicit strict-build mechanism.

Acceptable designs include:

- A prebuild data-integrity script plus strict query behavior during the build
- A build wrapper that sets an environment flag such as `STRICT_DATA_READS=1`
- A query error policy that throws after bounded retries when strict mode is active
- Another simple design that makes accidental empty static generation impossible

Requirements:

- Normal runtime fallback may remain where product-appropriate.
- Production build reads must not silently substitute `[]` after database failure.
- A failed critical read must make the build fail.
- True zero-content states must remain distinguishable from connection failures.
- Vercel must use the strict build path, not an optional developer-only command.
- The implementation must work on Windows and deployment Linux environments.

Do not infer connectivity from returned counts if the count query itself fails open.

## 17. Add a prebuild integrity check

Add a command such as:

```bash
npm run verify:build-data
```

It must:

- Connect to PostgreSQL.
- Run the TipTap database audit.
- Verify Site Settings.
- Retrieve counts for each public content type.
- Verify tag lookup.
- Verify that expected published collections are readable.
- Fail on database errors.
- Print concise counts.
- Avoid exposing secrets.

Integrate it into the production build path if that is the clearest way to block degraded deployments.

## 18. Consider request/build memoization

Use React server `cache()` or another appropriate request-level strategy for repeated identical public reads when it actually reduces duplicate work.

Do not add persistent caching that can become stale without complete invalidation.

Document:

- Which functions are memoized
- Their arguments
- Their invalidation implications
- Why they are safe during static generation

Do not use caching to hide P1017.

---

# Part III — Verification

## 19. Static verification

Run:

```bash
npm ci
npm run db:generate
npm run validate:editor-content
npm run audit:content
npm run verify:build-data
npx tsc --noEmit
npm run lint
npm run build
```

Run the final production build at least twice in fresh Node processes.

Acceptance:

- No Zod invalid-content dump
- Zero invalid database documents
- No Prisma `P1017`
- No query module returns an accidental empty fallback during strict build
- No failed build-data check
- Build exits 0 both times

## 20. Verify generated content

Do not stop at the build exit code.

After `npm run build`, run:

```bash
npm run start
```

Verify representative routes:

```text
/
projects
projects/<known-slug>
labs
labs/<known-slug>
journal
journal/<known-slug>
certifications
timeline
skills
tags/<known-tag>
sitemap.xml
```

Compare the rendered/build output with the pre-recorded expected counts.

Also verify:

- Search includes expected Projects, Labs, Articles, and Certificates.
- Sitemap contains expected detail URLs.
- Known tag pages contain the expected records.
- No content page shows the invalid-document fallback.
- No collection is empty because of a failed query.

## 21. Regression checks

The repair must not break:

- GitHub allow-list authentication
- Admin route protection
- Server Action `requireAdmin()` checks
- Editor autosave
- Explicit Save changes
- Individual delete
- Bulk delete
- Loading skeletons
- Error boundaries
- Settings fallback
- Media Library
- Public design and routes

The previous stabilization report may claim these work. Re-test the highest-risk flows instead of assuming.

---

## 22. Reporting and documentation

Create:

```text
docs/CODEX_BUILD_DATA_STABILIZATION_REPORT.md
```

Include:

1. Baseline environment and reproduction
2. Exact invalid content records found
3. Root cause of the TipTap errors
4. Schema or migration changes
5. Backup and migration procedure, if used
6. Static-generation query graph
7. Root cause of P1017
8. Query reductions
9. Retry policy
10. Strict-build behavior
11. Environment-variable validation
12. Files changed
13. Exact commands and results
14. Route/content verification
15. Remaining unverified behavior
16. Decision on whether Phase 6 may begin

Update:

```text
ARCHITECTURE.md
PROJECT_HANDOFF.md
README.md
```

only where the verified architecture or setup has changed.

Correct the prior stabilization report if it inaccurately says the local build was fully clean.

---

## 23. Phase gate

Do not begin Phase 6 until all of these are true:

- [ ] Existing database TipTap records audit successfully.
- [ ] The public renderer does not emit the massive invalid-union log.
- [ ] No content page renders the invalid-document fallback.
- [ ] Static generation completes without `P1017`.
- [ ] Production build cannot silently use empty fallbacks after database failure.
- [ ] Expected content counts match the built/running site.
- [ ] Tag queries no longer reload all collections for every tag.
- [ ] Search and sitemap contain expected records.
- [ ] Build succeeds at least twice.
- [ ] The Codex stabilization report is complete.
- [ ] The owner can reproduce the successful build locally.

---

## 24. Deferred work after the build is trustworthy

After the current stabilization is complete, Phase 6 may proceed.

Phase 6 currently includes:

- Planned caching and revalidation cleanup
- Dashboard consistency work
- Documentation cleanup
- CMS showcase Project
- Scheduled publishing resolution
- Dependency/security review

### Deferred template-system redesign

The owner has requested a new template workflow for Phase 6 or a later enhancement:

- New long-form content must not be automatically prefilled.
- Creation should offer **Blank** or a selected template.
- A template is inserted only when explicitly chosen.
- Projects, Labs, Articles, and applicable Certificate write-ups should have approximately 4–5 content-specific templates.
- Template choices should appear as polished cards below the creation form.
- Cards should match the existing dark technical portfolio style.
- Cards should have clear selected state, concise section previews, and optional full preview.
- Changing the template after writing begins must require confirmation.
- Timeline and Skills do not need long-form templates.

Do not implement this template redesign until the current build/data stabilization passes, unless the owner changes the priority.

---

## 25. Final response expected from Codex

When the task is complete, provide:

```text
Build/data stabilization is complete.

Root causes:
- ...
- ...

Implemented:
- ...
- ...

Verification:
- Editor fixtures:
- Database content audit:
- Build-data verification:
- TypeScript:
- Lint:
- Build run 1:
- Build run 2:
- Route/content smoke tests:

Documentation:
- docs/CODEX_BUILD_DATA_STABILIZATION_REPORT.md
- ARCHITECTURE.md updates

Remaining limitations:
- ...

Phase 6 readiness:
- Ready / Not ready, with reason
```

The repository itself is the primary deliverable. Do not return only code snippets or a proposed plan.
