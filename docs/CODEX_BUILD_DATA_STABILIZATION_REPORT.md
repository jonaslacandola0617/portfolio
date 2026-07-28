# Codex Build/Data Stabilization Report

**Date:** July 28, 2026  
**Scope:** Real-data build correctness before Phase 6  
**Outcome:** Passed. Phase 6 may begin, but was not started.

## 1. Baseline environment and reproduction

- Node.js: `v24.14.0`
- npm: `11.9.0`
- Prisma CLI/Client: `6.19.3`
- Branch: `main`
- Initial worktree: clean except the owner-supplied untracked
  `CODEX_PROJECT_TAKEOVER_HANDOFF.md`

All required environment variables were present and non-empty. Safe URL inspection found:

- `DATABASE_URL`: Neon, pooled (`-pooler`), SSL enabled
- `DIRECT_URL`: Neon, unpooled, SSL enabled
- URLs are distinct

No usernames, passwords, complete URLs, or tokens were printed.

The unchanged real-data baseline build reproduced the TipTap failure. The completed baseline log
was 56,552,900 bytes because four renderer calls printed full nested Zod `invalid_union` trees.
The build still exited 0 and generated 73 pages.

The owner-supplied build log confirmed repeated Prisma P1017 connection closures. P1017 did not
recur in this session's completed baseline build or a bounded 144-read concurrency probe, so the
server-side trigger remains intermittent. The correctness defect was reproducible regardless:
the old public query catches converted database exceptions into `[]`/`undefined`, allowing a
degraded build to exit successfully.

Baseline and final logs are retained locally under `docs/debug/` and ignored from version control
because the original Zod log is exceptionally large.

## 2. Record-level content audit

Added `npm run audit:content`. It scans every non-null TipTap document in Project, Lab, Article,
and Certificate. Database failure or invalid content exits nonzero. Diagnostics contain record
identity, the first meaningful path, nearest node, and a short reason; document bodies and Zod
union trees are never printed.

Baseline result:

| Model | Non-null documents | Invalid |
| --- | ---: | ---: |
| Project | 4 | 0 |
| Lab | 4 | 0 |
| Article | 4 | 2 |
| Certificate | 0 | 0 |

Invalid records:

1. Article `cmruhp3y30029ccpkw6x24ida`, slug `osi-vs-tcpip-model`
   - First path: `content.3.content.0.content.0.content.0`
   - Nearest node: `tableHeader`
   - Reason: expected block content; found inline `text`
2. Article `cmruhp6q4002fccpkgkqy20pa`, slug `subnetting-cheat-sheet`
   - First path: `content.10.content.0.content.0.content.0`
   - Nearest node: `tableHeader`
   - Reason: expected block content; found inline `text`

## 3. TipTap root cause and decision

Both documents were legacy seed-era table JSON. Their `tableCell`/`tableHeader` nodes contained
`text` nodes directly. TipTap 3's table contract is block content (`block+`), normally one
`paragraph`; the current TypeScript, Zod, editor, seed converter, renderer, and fixture contract
already model that correctly.

Decision: **legacy-data migration, not schema repair**. Validation was not weakened.

## 4. Migration and backup

Added:

```text
npm run migrate:content -- --dry-run
npm run migrate:content -- --write
```

Dry-run is the default. The deterministic normalization wraps contiguous inline table-cell
children in a paragraph, preserves text and marks, validates the complete result before writing,
and changes no already-valid document. Write mode:

1. Writes affected pre-migration rows to ignored
   `backups/content-migrations/before-table-cell-normalization-<timestamp>.json`.
2. Updates only affected records in one Prisma transaction.
3. Leaves seed data and unrelated CMS edits untouched.

The applied backup is
`backups/content-migrations/before-table-cell-normalization-2026-07-27T16-19-07-262Z.json`.
Two Articles were updated. A second dry-run reported `records=0`, proving idempotence. The
post-migration audit reports 12 checked, 0 invalid.

## 5. Concise renderer diagnostics

`ContentRenderer` now requires record context (model, database id, slug, title). Invalid content
logs one bounded line using the same structural diagnostic formatter as the audit. The visible
public fallback remains safe, but the server log identifies the exact record and path without
printing content bodies or a Zod union tree.

## 6. Static-generation query graph

```text
npm run build
  -> strict preflight
     -> four content audit reads
     -> public counts + Settings singleton
     -> direct sample-tag lookup
  -> Next static generation
     -> root layout: Search index (Projects + Labs + Articles + Certificates), Settings
     -> home/collection pages: published collection reads
     -> detail params: slug-only reads
     -> detail pages/metadata: slug-specific reads
     -> tags params: one published-tag summary read
     -> each tag page: one tag-specific relational read
     -> sitemap: three slug reads + one published-tag summary read
```

Identical query functions are wrapped with React `cache()` and memoized by arguments within the
render/request lifecycle. No persistent cache was added, so existing mutation revalidation
semantics are unchanged.

## 7. P1017 and query reduction

The database URLs and Prisma singleton follow the intended Neon roles. Official Neon/Prisma
guidance supports a pooled runtime URL, direct migration URL, SSL, and one reused Prisma Client.
No credential changes were required.

The exact remote cause of the intermittent P1017 was not reproducible in this session. Two
application-level amplifiers were confirmed and fixed:

- Every one of 29 tag pages loaded all Projects, Labs, and Articles: 87 full collection reads,
  plus 3 more full reads to enumerate tags.
- Query catches silently returned empty values during builds.

Tag generation now uses one published-tag summary query plus one direct relational query per tag:
30 bounded tag queries total, with only matching published title/slug rows returned.

## 8. Retry policy

`lib/db/read-policy.ts` retries only idempotent reads when the error is P1017 or has a confirmed
connection-closed signature.

- Maximum: 3 total attempts
- Delay: short exponential backoff from 100 ms plus up to 39 ms jitter
- Logs: operation, attempt, code, transient decision, retry decision, and a bounded first-line
  message
- No retries for validation, authorization, uniqueness, or arbitrary permanent failures
- No mutation retry

Retry is resilience only; it does not replace the query reduction or strict build gate.

## 9. Strict build-data behavior

`npm run build` now runs `scripts/run-strict-build.mjs`, which is cross-platform and:

1. Sets `STRICT_BUILD_DATA=1`.
2. Runs `verify:build-data`.
3. Runs `next build` only after the preflight succeeds.

In strict mode, any read failure is thrown after the allowed transient retry. Normal runtime
fallbacks remain available where product-appropriate. A true zero-row result remains a successful
query and is distinct from a database exception.

`verify:build-data` checks the content audit, Settings singleton, all public counts, published tag
count, and a direct tag lookup.

Verified counts:

| Data | Count |
| --- | ---: |
| Published Projects | 4 |
| Published Labs | 4 |
| Published Articles | 4 |
| Published Certificates | 4 |
| Published Timeline Entries | 10 |
| Skills | 37 |
| Published tags | 29 |
| Site Settings rows | 1 |

## 10. Search, tags, and sitemap

- Search now indexes Certificates in addition to Projects, Labs, and Articles: 16 real records.
- Tag pages preserve the existing route/design and use the tag table's original display name.
- Sitemap now contains tag routes as well as static and content-detail routes.
- Expected sitemap total: 10 static + 12 detail + 29 tag = 51 URLs.

Added `npm run verify:site` for a running production server. It compares HTTP output with live
database records, checks every published detail route, collection membership, Certificate search
payloads, one real tag page, absence of the invalid-content fallback, and sitemap membership/count.

## 11. Verification results

Commands completed successfully:

```text
npm ci
npm run db:generate
npm run validate:editor-content       # 17/17 fixtures
npm run audit:content                  # 12 checked, 0 invalid
npm run migrate:content -- --dry-run   # 0 remaining
npm run verify:build-data              # counts above, tag lookup ok
npx tsc --noEmit                       # 0 errors
npm run lint                           # 0 warnings/errors
npm run build                          # final build 1, 73/73 pages
npm run build                          # final build 2, 73/73 pages
npm run verify:site                    # routes/search/tags/sitemap ok
```

Both final builds ran in fresh Node processes. Neither log contains `invalid_union`,
`Invalid TipTap`, P1017, connection-closed messages, retry logs, fallback warnings, or failed
build-data checks.

Final local HTTP verification:

- Projects: 4 collection records + 4 detail routes
- Labs: 4 collection records + 4 detail routes
- Articles: 4 collection records + 4 detail routes
- Certificates: 4 collection/search records
- Timeline and Skills: HTTP 200
- Tag: `networking`, 4 expected records
- Sitemap: 51/51 URLs
- Invalid-document fallback: absent

## 12. Files changed

Core additions:

- `lib/content-audit.ts`
- `lib/content-diagnostics.ts`
- `lib/db/read-policy.ts`
- `lib/db/queries/tags.ts`
- `scripts/audit-content.ts`
- `scripts/migrate-content.ts`
- `scripts/verify-build-data.ts`
- `scripts/run-strict-build.mjs`
- `scripts/verify-running-site.ts`

The public query modules, tag page, sitemap, search types/dialog, renderer call sites,
reading-time extraction, package scripts, `.gitignore`, README, architecture, handoff, and prior
stabilization report were updated consistently.

No public route, authentication boundary, editor architecture, CMS mutation path, or visual
layout was replaced.

## 13. Remaining unverified behavior

This pass did not perform real GitHub OAuth login, Vercel Blob upload/delete, or interactive
browser testing of admin autosave/delete/bulk-delete controls. Those paths were not changed.
Authentication and admin mutation boundaries were reviewed for accidental diff and remain intact.

P1017 did not recur after repair, but its remote origin remains intermittent rather than
laboratory-reproducible. The strict build gate prevents recurrence from producing a false-success
artifact, and the bounded retry covers only the confirmed safe transient case.

## 14. Phase gate

- [x] Existing database TipTap records audit successfully.
- [x] Renderer no longer emits massive invalid-union logs.
- [x] No content page renders the invalid-document fallback.
- [x] Two static builds completed without P1017.
- [x] Production build cannot silently use empty database fallbacks.
- [x] Real counts match the built/running site.
- [x] Tag pages use direct tag-specific queries.
- [x] Search and sitemap contain expected records.
- [x] Two final builds succeeded.
- [x] Stabilization documentation is complete.

**Decision:** the build/data stabilization gate passes and Phase 6 may begin. Phase 6 and the
deferred template redesign were not started in this work.

## 15. Runtime save/autosave stabilization (July 28, 2026)

Phase 6 remained paused after the build gate because authenticated runtime use exposed a separate
save failure. This section supersedes section 13's earlier statement that admin autosave had not
been browser-tested.

### Exact serialization failure

The failing value was not a TipTap `Editor`, transaction, selection, event, or Prisma value.
ProseMirror's installed `prosemirror-model` creates node and mark attribute dictionaries with
`Object.create(null)` (`computeAttrs()` and default attrs). `Node.toJSON()` then reuses those
attribute dictionaries in the result returned by `editor.getJSON()`.

Examples include:

- `content[n].attrs.level`'s containing heading `attrs` object;
- link mark `attrs`;
- code-block `attrs.language`;
- ordered-list, task-item, table-cell, callout, command-block, and Mermaid `attrs`.

The exact old client/action boundaries were:

| Client boundary | Server Action |
| --- | --- |
| `ProjectForm` → `EditorShell` → `useAutosave` | `autosaveProjectContentAction(id, content)` |
| `LabForm` → `EditorShell` → `useAutosave` | `autosaveLabContentAction(id, content)` |
| `ArticleForm` → `EditorShell` → `useAutosave` | `autosaveArticleContentAction(id, content)` |
| `CertificateForm` → `EditorShell` → `useAutosave` | `autosaveCertificateContentAction(id, content)` |

A controlled authenticated browser page passed a normal payload root with one nested
null-prototype heading `attrs` object to each real action. All four reproduced React's exact
`Only plain objects ... Classes or null prototypes are not supported` failure before action code
ran. The temporary reproduction route was removed.

The metadata forms were audited separately. Their supported boundary was a top-level `FormData`
plus a bound primitive record id; no unsupported value crossed it. The serialization exception
affected editor autosave, not metadata validation/Prisma directly. Metadata saving still had real
independent defects described below, which explains why removing only the exception would not have
fixed the user's overall symptom.

### Serialization contract

`lib/editor/serialize-content.ts` is now the only TipTap-to-Server-Action conversion boundary.
It:

1. Accepts unknown editor output.
2. Recursively rejects circular references, accessors, symbol keys, `undefined`, functions,
   symbols, `bigint`, non-finite numbers, and class instances such as `Date`, `Map`, and `Set`.
3. Copies normal and null-prototype dictionaries into normal object literals without dropping
   enumerable data.
4. Validates the complete TipTap document.
5. Asserts that every returned nested object has `Object.prototype`.

The action payload is exactly:

```ts
type SaveContentPayload = {
  id: string;
  content: TipTapDoc;
  clientRevision: number;
};
```

No JSON stringify/parse calls are scattered through forms. Link's real TipTap attributes
(`target`, `rel`, `class`, `title`) and ordered-list `start`/`type` are now in the shared
TypeScript/Zod contract, so valid attributes are preserved instead of silently stripped.
`npm run verify:save-pipeline` proves null-prototype normalization and rejection of unsupported
values.

### Additional defects repaired

1. The old autosave queue had no revision number. An older success could briefly set `Saved` while
   a newer edit was queued.
2. Automatic retry read `latestValue.current` without correlating a result to a revision; retry
   semantics were ambiguous and could resend the wrong snapshot.
3. `saveNow()` returned before an in-flight queued value was persisted, so metadata Save could not
   await it.
4. Metadata Save never flushed editor content and could report success while content was still
   debouncing, saving, or failed.
5. `requireAdmin()` failures escaped autosave as thrown/redacted action errors.
6. Content services trusted `prisma.update()` without a separate PostgreSQL read-back.
7. Autosave validation logged full Zod issue arrays rather than bounded record/path/node context.
8. Metadata validation failures had field messages but no failure summary beside Save changes.
9. Public revalidation refreshed the current Server Component tree and erased transient metadata
   and editor feedback. Feedback is now restored per record after that refresh.
10. Certificate optional content could be saved but was not read or rendered on
    `/certifications`; non-null optional write-ups now render below the existing card body without
    changing cards that have no write-up.
11. No soft-navigation warning existed for a known pending editor revision.

### Concurrency and manual Save behavior

`useAutosave` now increments `clientRevision` for every `onUpdate`, allows one request in flight,
queues changes made during that request, skips retries for obsolete snapshots, and resolves a
manual flush only when the newest revision is confirmed. A response can set `Saved` only when its
revision equals the newest local revision. Two bounded retries use the newest relevant snapshot;
`Retrying...` appears only during a real retry/backoff.

`Save changes` now:

1. shows its own continuous pending/spinner state;
2. flushes and awaits the current editor document;
3. refuses metadata submission if content persistence fails;
4. submits a newly constructed top-level `FormData` only after the editor result succeeds;
5. shows `Metadata changes saved.` independently of the editor's `Saved` status.

`beforeunload` protects reload/external navigation, and a capture-phase internal-link guard warns
before a Next.js soft navigation while a known revision remains pending.

### Structured results and logging

All four content actions return `SaveResult` with:

- success: ISO `savedAt` plus confirmed `revision`;
- failure: one of `SERIALIZATION_ERROR`, `VALIDATION_ERROR`, `AUTH_ERROR`, `NOT_FOUND`,
  `DATABASE_ERROR`, `CONFLICT`, or `UNKNOWN_ERROR`, a safe message, and the attempted revision.

Every action still calls `requireAdmin()`. Server validation logs contain content type, record id,
operation, validation stage, and a bounded path/node/reason. Database logs include the Prisma code
when present and intentionally omit raw Prisma errors because invocation excerpts can include
document data. No URL, credential, full session, or document body is logged.

### Authenticated browser and PostgreSQL verification

Tests used the real GitHub-authenticated CMS and configured Neon database. Temporary markers were
written, read back after reload, rendered publicly, then restored. Cleanup was read back directly
from PostgreSQL; the final audit contains no temporary values.

| Content type | Metadata only | Editor only / rapid | Metadata + editor, immediate Save | Reload/read-back | Public render |
| --- | --- | --- | --- | --- | --- |
| Project | Passed | Passed; edits made during an in-flight save queued the newest revision | Passed | Passed | Passed on project detail |
| Lab | Passed | Passed | Passed | Passed | Passed on lab detail |
| Article | Passed, including deliberate invalid slug | Passed | Passed | Passed | Passed on journal detail |
| Certificate | Passed | Passed on optional content | Passed | Passed; original null restored after test | Passed on certifications collection |

A controlled transient-result test returned `DATABASE_ERROR` three times: the UI performed exactly
two automatic retries, ended in `Save failed` with a visible `Retry`, and changed to `Saved` only
after the manual retry returned a successful confirmed revision. Its temporary route was removed.
A real Neon outage was not induced because deliberately disrupting the shared database connection
would not be a safe test.

The in-flight race test wrote an old project revision, edited again while its request was active,
and confirmed after reload that PostgreSQL contained the newer combined value, never only the stale
value.

### Final runtime phase gate

- [x] Four real actions reproduce the old null-prototype failure.
- [x] No unsupported TipTap object crosses the repaired action boundary.
- [x] Metadata and editor feedback are independent and visible near their controls.
- [x] Manual Save flushes the newest content before metadata submission.
- [x] Revision ordering, queued edits, bounded retry, final failure, and manual retry are verified.
- [x] All four content types persist through PostgreSQL read-back and reload.
- [x] Published Project, Lab, Article, and Certificate optional content render publicly.
- [x] Test markers and the tested Certificate's original null optional content were restored.

Phase 6 and the deferred template redesign remain out of scope until the final static verification
and two clean builds below pass.

## 16. Final save/runtime verification

All required checks passed after the runtime repair:

```text
npm ci                              # 848 packages installed; postinstall Prisma generation passed
npm run db:generate                 # Prisma Client 6.19.3 generated
npm run verify:save-pipeline        # null-prototype normalization + unsupported-value rejection passed
npm run validate:editor-content     # 17/17 fixtures
npm run audit:content               # 12 non-null documents checked, 0 invalid
npm run verify:build-data           # 4/4/4/4 content counts; 29 tags; direct lookup ok
npx tsc --noEmit                    # 0 errors
npm run lint                        # 0 warnings/errors
npm run build                       # final build 1, 73/73 pages
npm run build                       # final build 2, 73/73 pages
npm run verify:site                 # routes/search/tags/sitemap match live database
```

Both builds completed without P1017, content fallback, or Server Action serialization errors.
Production verification reported 4 Projects, 4 Labs, 4 Articles, 4 Certificates, 29 tags, and
51 sitemap URLs; the real `networking` tag contained 4 items. Search, every published detail
route, collection membership, the direct tag route, and sitemap membership/count passed.

Final PostgreSQL state was read back after browser-test cleanup:

- the tested Project, Lab, and Article titles and documents match their original values;
- no `CODEX_*` or `[save-test]` values remain;
- the tested Certificate's optional content is back to its original `null`;
- the content audit again reports Project 4, Lab 4, Article 4, Certificate 0 non-null documents,
  all valid.

Remaining limitations:

- A real Neon connection outage was not deliberately induced. The structured database-error,
  automatic retry, final failure, and manual-retry UI were tested with a controlled authenticated
  action result; real P1017 handling remains dependent on Neon/Prisma emitting the expected code.
- An abrupt process/browser crash cannot complete an asynchronous final save. Known pending state
  is guarded by `beforeunload` and internal-link confirmation, but persistence still requires a
  successful server response.
- `npm ci` reports 16 high-severity transitive dependency advisories. They predate this repair and
  were not changed with an unscoped/breaking `npm audit fix --force`.

**Final decision:** build/data and authenticated save/autosave stabilization gates pass. Phase 6
and the deferred template redesign were not started.
