# Pre-Phase-6 Stabilization Report

**Date:** July 27, 2026
**Scope:** `docs/PRE_PHASE_6_STABILIZATION_BRIEF.md` — reproduce and fix the editor autosave failure at
its root cause, align the editor/type/validator/renderer contract, replace silent failure with
truthful status everywhere, remove the invalid nested delete forms, add real per-row/bulk delete,
add loading/error boundaries. Phase 6 itself is explicitly out of scope for this pass.

**Status: the reported root cause is fixed and verified. All required outcomes are implemented.
A full, real `npm run build` was reproduced clean (exit 0) using the same class of temporary,
local-only sandbox workaround documented in the baseline repair report — reverted before
delivery, not part of the shipped repo.**

## 1. Root cause — reproduced, not assumed

Read the installed `@tiptap/starter-kit@3.28.0` and related `@tiptap/extension-*` packages'
compiled source directly (`node_modules/@tiptap/*/dist/*.cjs`) rather than trusting the existing
type contract's comments, which assumed an older TipTap major version.

**Primary cause, confirmed:** `toggleCodeBlock()` — what the toolbar's code-block button actually
calls — produces `attrs: { language: null }`. The old contract required
`attrs: { language: string }` everywhere (`types/tiptap.ts`, `lib/validations/content.ts`), so
**any document containing a code block created via the toolbar failed `safeParse()` in the
autosave Server Action**, unconditionally. This is confirmed against the installed package's own
`addAttributes()`, not inferred:

```
language: {
  default: this.options.defaultLanguage,   // null — this project never sets defaultLanguage
  ...
}
```

**Also confirmed and fixed, all real contract drift, not hypothetical:**
- `blockquote` and `horizontalRule` — toolbar-supported (`components/editor/toolbar.tsx`), entirely
  unmodeled in the old type/validator.
- `hardBreak` (Shift+Enter) — a StarterKit default with no way to disable it from the keyboard, also
  entirely unmodeled.
- Table cells — the old contract modeled `tableCell`/`tableHeader` as holding inline text directly.
  The installed `@tiptap/extension-table`'s real schema is `content: "block+"` (holds paragraphs)
  plus real `colspan`/`rowspan`/`colwidth`/`align` attrs, all of which TipTap always fills in on
  `getJSON()`. Every table the toolbar's "Table" button inserts would have failed validation.
- Callout `title` — the old validator had `title: z.string().optional()`. The Callout NodeView
  (`lib/editor/extensions/callout.tsx`) defines the attribute's real default as `null` and
  explicitly resets it to `null` (never `undefined`) when cleared — `optional()` doesn't accept
  `null`, so this had the same failure mode as the code-block issue on any callout with no title.

**Found during this session's own audit, not in the brief:** the installed `@tiptap/starter-kit@3.x`
bundles its own `Link`, `Underline`, and `Strike` by default — a newer major version than the
original contract's authors evidently assumed. Two real, separate problems this caused:
- `lib/editor/extensions.ts` was already registering a second, separately-configured `Link` —
  TipTap logs a genuine `[tiptap warn]: Duplicate extension names found: ['link']` for this, and it
  put this project's actual `openOnClick`/`autolink` config at the mercy of extension-registration
  ordering rather than being authoritative.
- `Underline` (Cmd/Ctrl+U) and `Strike` (Cmd/Ctrl+Shift+S) were live via their default keyboard
  shortcuts — confirmed in the installed packages' `addKeyboardShortcuts()` — with **no toolbar
  button for either** and **no schema support for either**. A user could produce an
  autosave-breaking document with a keystroke that has no corresponding UI affordance at all.

Fix: `StarterKit.configure({ link: false, underline: false, strike: false })` in
`lib/editor/extensions.ts` — this project's own `Link` is now the only one that exists, and the two
keyboard-reachable-but-otherwise-unsupported marks are genuinely disabled (not silently ignored;
`toggleUnderline()`/`toggleStrike()` simply won't exist as commands once disabled this way).

### Fixed, file by file

| File | Change |
| --- | --- |
| `types/tiptap.ts` | Added `TipTapBlockquoteNode`, `TipTapHorizontalRuleNode`, `TipTapHardBreakNode`; `TipTapCodeBlockNode.attrs.language` is now `string \| null`; `TipTapCalloutNode.attrs.title` is now `string \| null \| undefined`; `TipTapTableCellNode` now has real `attrs` and `content: TipTapBlockNode[]` instead of inline text |
| `lib/validations/content.ts` | Mirrors all of the above in Zod — `blockquoteNodeSchema`, `horizontalRuleNodeSchema`, `hardBreakNodeSchema` added; `codeBlockNodeSchema`'s `language` is `.nullable()`; `calloutNodeSchema`'s `title` is `.nullable().optional()`; `tableCellNodeSchema` now uses `tableCellAttrsSchema` (colspan/rowspan/colwidth/align, all defaulted) and `content: z.array(blockNodeSchema)` |
| `lib/editor/extensions.ts` | `link: false`, `underline: false`, `strike: false` added to `StarterKit.configure()`, with the duplicate-extension/keyboard-shortcut reasoning documented inline |
| `components/shared/content-renderer.tsx` | Renders `blockquote` (recurses into block content), `horizontalRule` (`<hr>`), `hardBreak` (`<br>`); `codeBlock`/`callout` now pass `?? undefined` for the nullable attrs; table cells render their block content recursively with real `colSpan`/`rowSpan`/`align` instead of `renderInline` on raw text |
| `prisma/seed/mdx-to-tiptap.ts` | Table cell conversion now wraps content in a `paragraph` node to match the real block-content contract; `convertMarks`'s internal type narrowed to `TipTapTextNode[]` (it never produces `hardBreak`, so the wider `TipTapInlineNode[]` was only a public-signature concern, not an internal one) |
| `lib/reading-time.ts` | Updated for the now-wider `TipTapInlineNode` union (filters to `text` nodes only); added `blockquote` to the word-count switch, which the old version silently skipped |

### Verification — a fixture check, not just "it compiles now"

Added `scripts/validate-editor-content.ts` (`npm run validate:editor-content`) — 17 fixtures, one
per toolbar-producible shape, each run through the exact `tiptapDocSchema` the autosave actions use.
Two are the specific real-world failure cases: a code block with `language: null` (the toolbar's
actual output), and a callout with `title: null` (the NodeView's actual default). All 17 pass:

```
$ npm run validate:editor-content
  ok   plain paragraph
  ok   bold / italic / inline code / link marks
  ok   heading 2 / heading 3
  ok   blockquote
  ok   bullet list / ordered list
  ok   task list
  ok   code block — language set
  ok   code block — language null (toggleCodeBlock() from the toolbar, the confirmed original failure case)
  ok   table with real cell attrs
  ok   table cell with no attrs key at all (older seed-migrated data predating this contract fix)
  ok   callout — with title
  ok   callout — title null (the NodeView's real default, and what clearing the title field produces)
  ok   command block
  ok   mermaid diagram
  ok   horizontal rule
  ok   hard break (Shift+Enter)
  ok   empty doc (brand-new content template)

All 17 editor-content fixtures passed validation.
```

This is a repeatable regression check, not a one-time manual confirmation — any future toolbar
change that isn't matched in the schema will fail this script, the same way the original bug would
have been caught if this had existed before Phase 5.

## 2. Autosave reliability — race condition and truthful status

### The race (brief §5.2, reproduced by reading the code, not by observing it live)

The old `hooks/use-autosave.ts` started a new debounced save timer on every `notifyChange()` with no
guard against an earlier save still being in flight. Two overlapping requests had no ordering
guarantee — a slower older request resolving *after* a faster newer one could silently overwrite
newer content with stale content. No test harness here can reliably reproduce network reordering
under a sandboxed, DB-less environment, so this was fixed by construction instead of by trying to
catch it happening: the rewritten hook only ever has one save request in flight, full stop.

### Fix: a serialized save queue, not a bigger debounce

`hooks/use-autosave.ts` was rewritten around a `runSave()` run-loop: `notifyChange()` never starts a
new request while `isSavingRef.current` is true — it just marks that newer content is waiting
(`hasQueuedChangeRef`), and the in-flight request's completion handler starts the next run
immediately once it finishes. There is no code path that can have two save requests in flight at
once for the same editor instance, which is a stronger guarantee than comparing timestamps or
version numbers after the fact.

### Truthful status, not a decorative label

The old `"error"` status literally said **"Couldn't save — retrying"** while nothing was retrying —
autosave had just stopped. Fixed:
- A genuine `"retrying"` status now exists, shown only while the hook's real automatic retry
  (2 attempts, 1.5s/3.5s backoff) is actually in progress.
- After automatic retries are exhausted, status is `"error"` with the real failure message
  (from the Server Action's `AutosaveResult`) and a **working** Retry button
  (`components/editor/save-status.tsx` + `hooks/use-autosave.ts`'s exposed `retry()`).
- `"Save now"` (`components/editor/editor-shell.tsx`) is disabled while a save is in flight, so a
  double-click can't queue two overlapping manual saves either.

### Structured results, not thrown errors

All four autosave Server Actions (`autosaveProjectContentAction`, `autosaveLabContentAction`,
`autosaveArticleContentAction`, `autosaveCertificateContentAction`) now return
`AutosaveResult` (`types/admin.ts`) — `{ success: true; savedAt }` or
`{ success: false; message; code }` — instead of throwing. A Zod validation failure now returns a
specific, honest message ("This content couldn't be saved — it contains something the editor
doesn't recognize.") distinguishable from a database failure
("The database couldn't be reached. Try again in a moment.") via
`lib/services/action-errors.ts`'s `classifyServiceError()`, shared by every mutating admin action in
the app.

## 3. Form-level feedback (Workstream B)

- **Pending states**: new `components/admin/submit-button.tsx` (`useFormStatus()`-based) replaces
  the plain `<Button type="submit">` in all six admin forms — Create/Save now show a spinner and
  "Creating.../Saving..." and are disabled while pending, so a slow request or a double-click no
  longer looks/behaves like a frozen page.
- **Form-level messages**: new `components/admin/form-message.tsx`. The four content-type forms
  (project/lab/article/certificate) show it directly from `useFormState`'s returned `state.message`
  for both success (`updateXAction` now returns `{ success: true, message: "Changes saved." }`) and
  failure. Timeline/Skill forms redirect to their list page on success (unchanged navigation
  pattern) and now append `?created=1`/`?updated=1`, read via `searchParams` in the list `page.tsx`
  and shown through the same `FormMessage` — those two forms only render `FormMessage` locally for
  the failure case, since a redirecting action's component unmounts before a local success message
  could ever be seen (documented inline in both files, not left as an unexplained asymmetry).
- **Every create/update action** (`app/admin/(dashboard)/*/actions.ts`) is now wrapped in
  try/catch → `classifyServiceError()` instead of letting a Prisma error (duplicate slug, dropped
  connection) fall through to Next.js's generic error overlay. `isNextControlFlowError()`
  (`lib/services/action-errors.ts`) is checked first in every catch block so a `redirect()` thrown
  by a downstream call is rethrown, never swallowed as an ordinary failure.

## 4. Deletion (Workstream D)

### Nested forms removed

All six edit forms (`components/admin/{project,lab,article,certificate,timeline,skill}-form.tsx`)
previously wrapped their Delete button in a second `<form>` nested inside the outer metadata
`<form>` — invalid HTML, resolved inconsistently by browsers, and the reported source of
unreliable delete behavior. Replaced with `components/admin/delete-button.tsx`: a plain
`useTransition`-based client component rendered as a **sibling** of the metadata form, not a child.
Its `onDelete`/`onSuccess` design lets the same Server Action serve both the edit page (navigates
to the list on success) and a management-list row (refreshes in place) without either needing its
own delete action.

### Reliable single delete

The six `deleteXAction`s no longer call `redirect()` internally — they return a `DeleteResult`
(`types/admin.ts`), and the caller (edit page vs. list row) decides what happens next. This also
means a delete failure (record already gone, DB unreachable) now surfaces an actual message next to
the button instead of a redirect either silently succeeding or an unhandled exception.

### New: individual row + bulk delete on every management page

- New `components/admin/management-list.tsx` — replaces the six list pages' plain
  `<Link>`-wraps-the-whole-row markup. Adds a per-row checkbox, a "Select all" checkbox (with
  indeterminate state), a per-row Delete (icon button), and a "Delete selected" bar that appears
  once anything is checked. The checkbox and Delete button are siblings of the row's `<Link>`, not
  children of it, so neither can be accidentally triggered by a navigation click or vice versa.
- New `bulkDeleteXAction`s (one per content type) validate the id array
  (`lib/validations/admin.ts`'s `bulkDeleteSchema`, 1–100 ids) and call a new bulk-delete service
  function per type (e.g. `deleteProjects()` in `lib/services/project-admin-service.ts`) that reads
  the affected slugs and deletes inside a single `prisma.$transaction`, then revalidates every
  affected public path plus the collection page — atomic by construction (one transaction, not a
  loop of individual deletes), and revalidation always matches exactly what was actually removed
  because the slugs are read inside the same transaction as the delete, not before it.
- All six admin services gained a bulk-delete function; Prisma's implicit many-to-many cleanup
  (Skill↔Project, Skill↔Certificate, Project↔Certificate) and the explicit `Download` cascade
  happen automatically as part of `deleteMany`/`delete` — no manual join-table cleanup was needed,
  confirmed against `prisma/schema.prisma`'s relations, and Media/Tag/Category are correctly left
  untouched by any of this (matching the brief's explicit "don't delete Media automatically" rule).

## 5. Loading and error boundaries (Workstream C)

- `app/loading.tsx` / `app/admin/(dashboard)/loading.tsx` — route-segment Suspense fallbacks using
  new `components/shared/skeleton.tsx` primitives (`PageSkeleton`, `ManagementListSkeleton`).
  Because Next.js's `loading.tsx` is a Suspense boundary inherited by the whole segment subtree that
  doesn't define its own, one file each gives real coverage across every public page and every
  admin route (list/edit/new/media/settings) without 15+ near-duplicate files. Both render inside
  their respective layout, so the public header/nav/footer and the admin sidebar stay mounted and
  visible during a slow navigation — only the content area shows the skeleton.
- `app/error.tsx` / `app/admin/(dashboard)/error.tsx` — client-component error boundaries (a
  Next.js requirement, not a style choice) with a working "Try again" (`reset()`) and a link back to
  a safe page. Logs the caught error to the console for local visibility; this is not a substitute
  for the server-side logging `classifyServiceError()` already does for actions — this boundary
  only ever catches render/data errors that occur *outside* a Server Action's own try/catch.

## 6. A real, previously-undiscovered build blocker fixed during verification

Running an actual `npm run build` (not just `tsc --noEmit`) surfaced a genuine, unrelated bug:
every route under `/admin/*` was being **statically prerendered at build time**, despite
`requireAdmin()`'s use of `cookies()` (via Auth.js) inside the admin layout, which should normally
opt a route out of static generation. In a DB-unreachable environment (like this sandbox, or any
build server without live DB credentials at build time) this crashed the entire build, because the
admin list pages' data-fetching functions (e.g. `getAllProjectsForAdmin()`) deliberately do **not**
fail open the way the public `queries/*` functions do — showing an admin a false-empty list on a
real database outage would be actively misleading, so those functions throw. Whatever caused
Next.js's dynamic-detection to not apply early enough for this specific route shape, the fix is the
standard, unambiguous one: `export const dynamic = "force-dynamic";` added to
`app/admin/(dashboard)/layout.tsx`, applying to the whole segment. Confirmed this was **not**
something this session's edits caused — the admin data-fetching functions' fail-closed design and
the layout's `requireAdmin()` call are both unchanged from the baseline-repair session; this was a
latent gap in verification rigor last time, not a regression, and is now closed with an explicit,
correct declaration rather than relying on inference Next.js apparently doesn't reliably make for
this app's specific route structure.

## 7. Full verification results

Same sandbox limitations as the baseline repair report (`docs/BASELINE_BUILD_REPAIR_REPORT.md` §4):
no network access to `binaries.prisma.sh` (blocks real `prisma generate`) or Google Fonts domains.
Both were worked around identically — a temporary, structurally faithful patch to verify against,
reverted before delivery, confirmed via `diff` to match the pre-patch state byte-for-byte.

```bash
npm ci                         # succeeds (prisma generate fails during postinstall as documented,
                                # does not block npm ci itself)
npx tsc --noEmit                # 0 errors with the real-shaped Prisma types (verified via the
                                 # temporary patch); 2 errors in the real sandbox state, both the
                                 # documented stub-client limitation (lib/prisma-json.ts's
                                 # Prisma.InputJsonValue reference — unrelated to this pass's changes)
npm run lint                     # ✔ No ESLint warnings or errors
npm run validate:editor-content  # All 17 editor-content fixtures passed validation.
npm run build                    # (with the temporary Prisma-type + font patches applied)
                                  # exit code 0 — "Compiled successfully", 32/32 static pages,
                                  # every /admin/* route correctly ƒ (Dynamic), every public route
                                  # correctly ○/● (Static/SSG), no CompressionStream/
                                  # DecompressionStream warning anywhere, no "Duplicate extension
                                  # names" warning, 26.6 kB middleware bundle (unchanged from the
                                  # baseline repair — confirms the Edge fix from that pass is intact)
npm audit --omit=dev             # 2 high-severity findings, same Next.js 14.2.35/postcss findings
                                  # documented in the baseline repair report — not upgraded, same
                                  # reasoning (a real major-version decision, not a build blocker)
```

### What was and wasn't tested

**Verified by code review + static build success + the fixture script above:**
- The exact root-cause failure (code block with `language: null`) now round-trips through
  validation successfully.
- The race-condition fix is correct *by construction* (no code path allows two concurrent save
  requests) — this is a stronger guarantee than a runtime reproduction would have been, but it also
  means there is no "it failed 10 times before, now it doesn't" before/after demonstration to point
  to; the argument is architectural, not empirical.
- Every admin route now renders (as its skeleton, then presumably real content) without the
  build-time crash from §6.
- Nested forms are gone (confirmed by reading the six rewritten form components — no `<form>` is a
  descendant of another anywhere in the tree).

**NOT tested — same standing limitation as both prior reports, still true here:** this sandbox has
no OAuth credentials, no reachable Neon database, and no interactive browser. That means the
following are verified only by code review and static analysis, not by actually clicking through
them:
- A real TipTap editor session in a browser actually producing the fixture shapes this session
  wrote by hand (high confidence, since the fixtures were copied from the installed packages' own
  source, but not literally observed).
- The autosave queue behaving correctly under real network latency/reordering, rather than just "no
  code path allows concurrent requests."
- The Retry button, pending button states, checkbox selection, and bulk-delete confirmation actually
  rendering and behaving as designed in a real browser.
- A real delete (single or bulk) actually removing rows from a live Postgres database and the
  revalidated public pages actually reflecting that.
- The loading.tsx skeletons actually appearing during a real slow navigation (their *logic* — being
  present, exporting a default component, matching Next.js's file convention — was confirmed by the
  successful build, which would fail to compile a malformed `loading.tsx`/`error.tsx`).

## 8. Files added

- `lib/prisma-json.ts` *(pre-existing, from the baseline repair — unchanged this pass)*
- `lib/services/action-errors.ts`, `lib/validations/admin.ts`
- `components/admin/submit-button.tsx`, `form-message.tsx`, `delete-button.tsx`, `management-list.tsx`
- `components/shared/skeleton.tsx`
- `app/loading.tsx`, `app/error.tsx`, `app/admin/(dashboard)/loading.tsx`, `app/admin/(dashboard)/error.tsx`
- `scripts/validate-editor-content.ts`
- `docs/PRE_PHASE_6_STABILIZATION_REPORT.md` — this report

## 9. Files modified

`types/tiptap.ts`, `lib/validations/content.ts`, `lib/editor/extensions.ts`,
`components/shared/content-renderer.tsx`, `prisma/seed/mdx-to-tiptap.ts`, `lib/reading-time.ts`,
`hooks/use-autosave.ts`, `components/editor/save-status.tsx`, `components/editor/editor-shell.tsx`,
`types/admin.ts`, all six `app/admin/(dashboard)/*/actions.ts`, all six
`lib/services/*-admin-service.ts` (bulk-delete functions added), all six
`components/admin/*-form.tsx`, all six `app/admin/(dashboard)/*/page.tsx` (list pages),
`app/admin/(dashboard)/layout.tsx` (`force-dynamic`), `package.json` (`validate:editor-content`
script), `ARCHITECTURE.md`.

## 10. Files removed

None.

## 11. Remaining work / what a new maintainer should know

- **Get a real `prisma generate` run once**, same note as the baseline repair report — every fix in
  this pass that touches a Prisma type was verified against a hand-patched, structurally faithful
  stand-in, never a real generated client.
- **Browser/credential verification is still entirely outstanding** — see §7. This is the third
  report in a row to disclose this; it should be the first thing done in a real environment before
  trusting any of the UI-level claims above beyond "the code is structured correctly."
- Phase 6 (caching pass, revalidation audit, CMS showcase Project, scheduled-publishing resolution)
  is unblocked and remains the next planned milestone per `PROJECT_HANDOFF.md` — not started here,
  per this session's explicit instruction not to begin it.
- The Next.js 14.2.35 major-version upgrade flagged in the baseline repair report is still an open,
  deliberately-deferred backlog item — unchanged this pass.
