# Pre–Phase 6 Stabilization Brief

**Project:** Cyber Portfolio CMS  
**Current base:** Phase 5 features + completed baseline build repair  
**Priority:** Complete this stabilization pass before beginning Phase 6  
**Scope type:** Runtime correctness, feedback states, navigation loading, and content-management deletion UX  
**Not Phase 6:** Do not mix the Phase 6 caching/dashboard/showcase scope into this task

---

## 1. Why this pass exists

The owner has now tested the repaired Phase 5 application in a real local environment and found
runtime problems that static type checking and the production build did not expose.

Observed behavior:

1. Rich editor content for Projects, Labs, and Journal Articles displays:
   **“Couldn't save — retrying”**
2. No useful error toast, inline explanation, or clearly visible server/CLI message identifies the
   cause.
3. Clicking **Save changes** gives no button-level pending feedback.
4. Navigating to a slow page leaves the previous page visible with no indication that the next
   route is loading.
5. Individual Delete actions do not work reliably.
6. The management pages do not support selecting and deleting multiple records.
7. The owner wants individual row deletion as well as bulk selection deletion.

The application must not proceed to Phase 6 until these workflows are dependable and visibly
communicate what they are doing.

---

## 2. Source-of-truth and working rules

Read before editing:

1. `PROJECT_HANDOFF.md`
2. `ARCHITECTURE.md`
3. `docs/BASELINE_BUILD_REPAIR_REPORT.md`
4. This file
5. The relevant actions, services, forms, editor, schemas, renderer, and admin pages

Use this priority when text conflicts:

1. Current source
2. Latest implementation report
3. Current architecture
4. This task brief
5. Older plans and reports

Do not restart the application, redesign the public site, replace the CMS stack, or begin Phase 6
while these defects remain.

---

## 3. Confirmed findings from source inspection

These are not guesses. They are visible in the supplied source and must be addressed.

### 3.1 The TipTap editor contract is out of sync

The editor, TypeScript types, Zod validator, and public renderer do not currently support the same
node shapes.

Examples already confirmed:

- The toolbar can insert `blockquote`, but `types/tiptap.ts`,
  `lib/validations/content.ts`, and `components/shared/content-renderer.tsx` do not model or render
  `blockquote`.
- The toolbar can insert `horizontalRule`, but the type, validator, and renderer do not model it.
- StarterKit can produce `hardBreak` inline nodes, but the current inline type and validator only
  allow text.
- The table validator/types model a table cell as direct inline text, while TipTap tables normally
  contain block content such as paragraphs inside cells.
- The custom Callout extension stores `title: null` by default, while the current validator accepts
  only an optional string, not `null`.
- Code-block language attributes must be checked against the actual JSON emitted by the installed
  TipTap version; the current contract requires a string and may reject `null`.
- StarterKit-enabled marks/nodes must be audited as a complete set, not patched one error at a time.

This contract drift can cause `safeParse()` in autosave Server Actions to reject content produced
by the project's own editor before Prisma is called.

### 3.2 The autosave status text is inaccurate

`hooks/use-autosave.ts` sets the status to `error` after a failed save.

`components/editor/save-status.tsx` labels that state:

```text
Couldn't save — retrying
```

However, no retry is scheduled. The status claims behavior the hook does not implement.

### 3.3 Autosave errors are opaque

The client only receives a rejected Promise and shows a generic status.

The Server Actions throw generic errors such as:

```ts
throw new Error(`Invalid content: ${parsed.error.message}`)
```

There is no structured autosave result, no user-safe reason, no manual Retry control, and no
persistent visible message near the editor. In production, Server Action errors may be redacted,
so throwing alone is not an adequate user-feedback design.

### 3.4 Every edit form contains invalid nested forms

The Project, Lab, Article, Certificate, Timeline, and Skill edit components place a Delete
`<form>` inside the main Save `<form>`.

Nested forms are invalid HTML and can cause the browser to submit the wrong action or ignore the
inner form.

Affected components:

```text
components/admin/project-form.tsx
components/admin/lab-form.tsx
components/admin/article-form.tsx
components/admin/certificate-form.tsx
components/admin/timeline-form.tsx
components/admin/skill-form.tsx
```

This is a concrete likely cause of the broken individual Delete behavior.

### 3.5 Explicit form submissions have no pending button UI

The forms use `useFormState`, but the submit buttons are ordinary buttons.

There is no shared component using `useFormStatus()` inside the parent form, so users cannot see:

- Saving...
- Creating...
- Disabled state while submitting
- Submission success
- Form-level failure

### 3.6 Route loading boundaries are absent

The supplied `app/` tree has no `loading.tsx` files and no route-level skeleton system.

The Next.js App Router supports `loading.tsx` as a Suspense fallback that can appear immediately
during navigation while the next segment is rendered. This is the correct baseline mechanism for
the requested page-transition feedback.

### 3.7 Management list rows are links with no selection/action layer

Projects, Labs, Journal, Certificates, Timeline, and Skills list pages render each entire row as a
`Link`.

To add checkboxes and row actions safely, the row structure must be changed so:

- The checkbox is not inside the navigation link.
- The row Delete action is not inside the navigation link.
- The title/details remain a clear link to Edit.
- Keyboard and screen-reader behavior remains valid.

---

## 4. Required implementation outcome

Complete four coordinated workstreams:

1. Save/autosave reliability and error visibility
2. Explicit Save button pending/success/error states
3. Route loading and route error feedback
4. Reliable individual and bulk deletion

Do not treat these as unrelated cosmetic patches. They form one admin reliability pass.

---

# Workstream A — Fix editor saving and autosave diagnostics

## A1. Reproduce before patching

With real local credentials where available:

1. Sign in to `/admin`.
2. Open an existing Project, Lab, Article, and Certificate.
3. Edit a plain paragraph and observe autosave.
4. Test every toolbar output:
   - Bold
   - Italic
   - Inline code
   - Link
   - Heading 2
   - Heading 3
   - Blockquote
   - Bullet list
   - Ordered list
   - Task list
   - Code block
   - Table
   - Callout with and without a title
   - Command Block
   - Mermaid
   - Horizontal Rule
   - Hard line break if the editor supports it
5. Capture the exact JSON produced by `editor.getJSON()` for failing cases.
6. Capture the actual Server Action result/log and Prisma result.

Do not assume the schema mismatch is the only cause. Confirm database/auth/action behavior too.

## A2. Establish one editor JSON contract

Align all of these:

```text
lib/editor/extensions.ts
lib/editor/extensions/*
types/tiptap.ts
lib/validations/content.ts
components/shared/content-renderer.tsx
components/editor/editor-shell.tsx
```

The contract must cover every node and mark that the configured editor can produce.

At minimum, audit and correctly support or deliberately disable:

- `doc`
- `text`
- `paragraph`
- `heading`
- `hardBreak`
- `blockquote`
- `horizontalRule`
- `bulletList`
- `orderedList`
- `listItem`
- `taskList`
- `taskItem`
- `codeBlock`
- `table`
- `tableRow`
- `tableCell`
- `tableHeader`
- `callout`
- `commandBlock`
- `mermaid`
- Bold
- Italic
- Strike if StarterKit leaves it enabled
- Inline code
- Link and its actual attributes

Do not leave a toolbar button enabled for JSON the validator or renderer rejects.

Do not “fix” this by changing the content schema to `z.any()` or weakening all content to
unvalidated `unknown`.

## A3. Preserve valid TipTap attributes

Current Zod parsing may strip unmodeled attributes before persistence because autosave stores
`parsed.data`.

Ensure validation does not silently remove valid attributes emitted by the editor.

Approaches may include:

- Explicitly modeling supported attributes, including nullable attributes.
- Using carefully scoped passthrough behavior where TipTap legitimately emits additional
  attributes.
- Persisting the original JSON only after a non-destructive validation succeeds.

The final design must remain safe and predictable.

## A4. Add contract fixtures or a validation script

Add a lightweight repeatable check that validates representative JSON for every supported toolbar
feature.

Do not introduce a large test framework solely for this if a small `tsx` validation script or
existing test tooling is enough.

Suggested command:

```text
npm run validate:editor-content
```

The check should fail if an enabled editor node is absent from the validator.

## A5. Return structured autosave results

Replace opaque throw-only behavior with an explicit result contract, for example:

```ts
type AutosaveResult =
  | { success: true; savedAt: string }
  | { success: false; message: string; code?: string };
```

Requirements:

- Every autosave Server Action still calls `requireAdmin()`.
- Zod details are logged on the server with content type and record id.
- The user receives a safe, useful summary.
- Unknown Prisma/database failures are logged with context.
- Sensitive internals are not exposed in the browser.
- Authentication failures remain fail-closed.

## A6. Make retry behavior truthful

Choose one of these:

### Preferred

Implement controlled retry:

- Retry only a small number of times.
- Use a short backoff.
- Do not allow overlapping saves to race and overwrite newer content.
- Queue the latest editor state while a save is in flight.
- Stop after the retry limit.
- Display a manual **Retry** button.

### Acceptable minimum

Do not automatically retry, but change the label to:

```text
Couldn't save
```

and add a visible manual **Retry** action.

Never display “retrying” unless a retry is actually taking place.

## A7. Improve autosave placement without removing it

The owner accepts the small automatic save status below the editor.

Keep that status, but make failures more visible:

- Saving spinner
- Saved state
- Last saved time where useful
- Error summary
- Retry button
- `aria-live` status updates
- Disable Save Now while a save is in progress

Do not replace autosave with explicit-only saving.

---

# Workstream B — Explicit Save/Create button feedback

## B1. Create a shared submit button

Create a reusable button rendered inside each metadata form that uses `useFormStatus()` from
`react-dom`.

It must:

- Show a spinner.
- Change its label:
  - `Creating project...`
  - `Saving changes...`
  - Equivalent content-specific wording
- Disable itself while pending.
- Preserve the current Button styling.
- Use accessible pending text and `aria-disabled`.

The hook must live in a child component rendered inside the parent form.

## B2. Add form-level result messages

Extend `ActionResult` as needed to support:

- `message`
- Form-level error
- Optional error code
- Field errors
- Success

Each form should visibly show:

- Validation errors near fields.
- A general error near the Save button or top of the form.
- A saved confirmation after a successful update.

Create actions that redirect can rely on the redirect after success, but must still return visible
errors when creation fails.

## B3. Catch and classify service failures

Wrap create/update operations carefully.

At minimum, handle and log:

- Duplicate slug/name constraints
- Record not found
- Invalid date or relation data
- Database connection errors
- Unknown write failures

Map known failures to safe messages such as:

- “That slug is already in use.”
- “This record no longer exists.”
- “The database could not save your changes. Try again.”

Do not catch Next.js redirects as ordinary errors. If an action redirects, call `redirect()` after
the service operation and outside a broad catch that would swallow the redirect exception.

## B4. Keep metadata save and autosave conceptually clear

The explicit button saves metadata.

The editor autosaves content separately.

The UI should make this distinction understandable without adding visual clutter.

Do not falsely imply that metadata has been saved merely because editor autosave succeeded, or
vice versa.

---

# Workstream C — Navigation loading and error states

## C1. Add reusable skeleton components

Build lightweight skeletons using existing Tailwind utilities. Do not add a heavy loading library.

Suggested reusable components:

```text
components/admin/admin-list-skeleton.tsx
components/admin/admin-form-skeleton.tsx
components/shared/page-content-skeleton.tsx
```

Match the existing layout enough that the page does not jump dramatically when loaded.

## C2. Add App Router loading boundaries

At minimum add:

```text
app/loading.tsx
app/admin/(dashboard)/loading.tsx
```

Then add more specific boundaries where they materially improve the shape:

```text
app/admin/(dashboard)/projects/loading.tsx
app/admin/(dashboard)/projects/[id]/loading.tsx
app/admin/(dashboard)/labs/loading.tsx
app/admin/(dashboard)/labs/[id]/loading.tsx
app/admin/(dashboard)/journal/loading.tsx
app/admin/(dashboard)/journal/[id]/loading.tsx
app/admin/(dashboard)/certificates/loading.tsx
app/admin/(dashboard)/certificates/[id]/loading.tsx
app/admin/(dashboard)/timeline/loading.tsx
app/admin/(dashboard)/timeline/[id]/loading.tsx
app/admin/(dashboard)/skills/loading.tsx
app/admin/(dashboard)/skills/[id]/loading.tsx
app/admin/(dashboard)/media/loading.tsx
app/admin/(dashboard)/settings/loading.tsx
```

A shared generic boundary is acceptable where a specific one would only duplicate markup.

Requirements:

- Keep the public sidebar/navigation visible while public content loads.
- Keep the admin sidebar visible while admin content loads.
- Use skeletons rather than a blank white area.
- Do not change routes or page design.
- Do not delay navigation artificially.
- Avoid client-only global route hacks when `loading.tsx` provides the correct segment behavior.

## C3. Add route error feedback

Add an admin error boundary, at minimum:

```text
app/admin/(dashboard)/error.tsx
```

It should:

- Explain that the page could not load.
- Offer **Try again** through the boundary reset function.
- Preserve the admin visual style.
- Log the error on the client and retain server-side logging where relevant.
- Avoid exposing sensitive database details.

Consider a public `app/error.tsx` if public route failures currently result in an unhelpful blank
state.

Loading states communicate “still working.” Error boundaries communicate “failed.” Both are
needed.

---

# Workstream D — Reliable individual and bulk deletion

## D1. Remove all nested forms

Refactor the six edit forms so the Delete control is not a form inside the Save form.

Acceptable patterns:

- A sibling Delete form outside the metadata form.
- A dedicated client Delete button using `useTransition`.
- A properly separated action component.

Do not use invalid nested form markup.

## D2. Add a shared delete interaction

Create a reusable Delete control consistent with the current UI.

Requirements:

- Confirmation before destructive action.
- Pending spinner and disabled state.
- Clear label such as `Deleting...`.
- Visible failure message.
- Works on edit pages and management list rows.
- Does not accidentally submit the Save form.
- Does not navigate when the user clicks a checkbox or Delete action.

A native `window.confirm` is acceptable as an initial implementation, but a project-native
confirmation dialog is preferred if it can be added without broad redesign.

## D3. Add individual delete on management pages

Each management row should include an individual Delete action in addition to the Edit link.

Apply to:

- Projects
- Labs
- Journal
- Certificates
- Timeline
- Skills

Keep a Delete action on the edit page as well.

## D4. Add multi-select deletion

Each management page must support:

- Checkbox per row
- Select all visible records
- Selected count
- `Delete selected`
- Confirmation containing the count
- Pending state
- Clear selection after success
- Refresh/re-render after deletion
- Visible error if deletion fails

The full row must no longer be one giant Link. Structure it as:

```text
[checkbox] [linked content details] [status] [row actions]
```

## D5. Secure and validate bulk actions

Every bulk delete Server Action must:

- Call `requireAdmin()`.
- Validate the content type and an array of ids.
- Reject an empty list.
- Apply a reasonable maximum batch size.
- Verify records before deletion where route revalidation needs slugs.
- Use an atomic transaction when practical.
- Return a structured result.
- Log failures with content type and ids.
- Never trust ids only because they came from a protected page.

## D6. Preserve relations and revalidation

Audit deletion behavior for each model.

For Projects:

- Downloads use cascade deletion.
- Many-to-many joins should be disconnected by Prisma.
- Thumbnail Media itself should not be deleted automatically unless explicitly intended.
- Project/Certificate links must not leave invalid relations.

For all content:

- Revalidate collection routes.
- Revalidate deleted detail routes.
- Revalidate home page where featured/recent content can change.
- Revalidate sitemap.
- Revalidate affected tag routes when tags are known.
- Do not automatically delete shared Tags, Categories, Skills, Certificates, or Media merely
  because one content record was deleted.

For bulk deletion, fetch the affected slugs/tags before deleting so invalidation can still target
them afterward.

---

## 5. Additional quality requirements

### 5.1 Do not hide the real errors

Add contextual server logging for:

- Content type
- Record id
- Operation
- Validation stage
- Prisma error code where available

Do not log:

- Auth secrets
- OAuth tokens
- Database URLs
- Full sensitive session data

### 5.2 Avoid race conditions in autosave

The current hook can start another delayed save while an earlier save is still running.

Implement one of:

- A serialized save queue that always saves the newest pending value after the current request.
- A sequence/version system that prevents an older response from overwriting the displayed state
  of a newer save.

The final saved record must represent the newest editor state.

### 5.3 Preserve current architecture

- Server Actions remain the mutation entry point.
- Every Server Action calls `requireAdmin()`.
- Services remain server-only.
- Prisma does not enter Client Components.
- Zod continues to validate trust boundaries.
- The public renderer remains a server-compatible recursive renderer.
- The current public and admin visual identities remain intact.

### 5.4 Do not begin Phase 6 scope

Do not include:

- Phase 6 caching pass
- Dashboard count redesign
- CMS showcase Project
- Scheduled publishing implementation
- Broad dependency upgrade
- Media picker
- Revision history
- Activity Log

The only exception is route revalidation directly required to make deletion correct.

---

## 6. Verification matrix

A clean build is necessary but not sufficient.

### 6.1 Static checks

Run:

```bash
npm ci
npm run db:generate
npx tsc --noEmit
npm run lint
npm run validate:editor-content
npm run build
```

If the new validation command uses a different name, document it.

### 6.2 Editor/autosave checks

For Project, Lab, Article, and Certificate:

- Plain text saves.
- Every toolbar feature saves.
- Save status changes from Unsaved → Saving → Saved.
- Save Now shows pending.
- A forced validation error shows a useful failure and Retry.
- A forced database failure shows a safe error.
- Recovery after a transient failure works.
- Rapid edits do not cause older content to overwrite newer content.
- Public rendering supports every saved node.

### 6.3 Metadata form checks

For all six content types:

- Create button shows pending.
- Save changes shows pending.
- Button cannot be double-submitted.
- Success is visible or redirects correctly.
- Duplicate slug/name shows a useful message.
- Validation errors remain visible.
- Unknown database failures show a general message and are logged.

### 6.4 Navigation checks

Test transitions between:

- Dashboard → Projects list
- Projects list → Project edit
- Project edit → Labs list
- Journal → Article edit
- Media
- Settings
- Public list → public detail

For a deliberately slowed data read:

- Skeleton appears promptly.
- Existing shared layout remains visible.
- Page swaps in after data resolves.
- Failed load shows an error boundary with Try again.

### 6.5 Delete checks

For every content type:

- Edit-page Delete works.
- Row Delete works.
- Cancel confirmation does nothing.
- Delete button shows pending.
- Deleted record disappears.
- Deleted detail URL no longer renders the record.
- Public page and sitemap are invalidated where relevant.

Bulk deletion:

- Select one.
- Select several.
- Select all.
- Deselect.
- Cancel.
- Confirm.
- Failure leaves a clear message and does not pretend success.
- No selection disables the action.
- A transaction failure does not produce an unexplained partial result.

### 6.6 Authorization checks

- Unauthenticated actions fail.
- A fake cookie cannot authorize mutation.
- Every new single/bulk delete action calls `requireAdmin()`.
- Autosave still requires a valid session.

---

## 7. Acceptance criteria

This stabilization pass is complete only when:

- [ ] The actual save failure is reproduced and documented.
- [ ] The root cause is fixed, not merely hidden.
- [ ] Editor extensions, types, Zod schema, and public renderer agree.
- [ ] Every enabled toolbar feature validates, saves, and renders.
- [ ] Autosave gives truthful Saving/Saved/Error states.
- [ ] Autosave failures show a reason and Retry.
- [ ] Autosave does not race newer content.
- [ ] Explicit Save/Create buttons show pending state.
- [ ] Form-level success and failure are visible.
- [ ] All nested forms are removed.
- [ ] Edit-page Delete works for all content types.
- [ ] Individual list-row Delete works.
- [ ] Bulk selection and deletion work on all six management pages.
- [ ] Bulk actions are authenticated, validated, and safely revalidated.
- [ ] Route navigation displays skeleton loading UI.
- [ ] Route failures display an error state with Try again.
- [ ] Public/admin design and routes remain unchanged.
- [ ] TypeScript passes.
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Real browser workflows are tested where credentials permit.
- [ ] `docs/PRE_PHASE_6_STABILIZATION_REPORT.md` is created.
- [ ] `ARCHITECTURE.md` is updated for reusable mutation/loading patterns.
- [ ] A complete repository ZIP is delivered.

Phase 6 may begin only after these criteria pass or any remaining environment-only limitation is
precisely documented.

---

## 8. Required report

Create:

```text
docs/PRE_PHASE_6_STABILIZATION_REPORT.md
```

Include:

1. Symptoms reproduced
2. Confirmed root causes
3. Editor contract changes
4. Autosave state-machine changes
5. Form feedback changes
6. Loading and error boundaries
7. Delete architecture
8. Bulk-delete validation/revalidation
9. Files added, changed, and removed
10. Exact verification commands/results
11. Browser/database/auth limitations
12. Remaining deferred work
13. Readiness decision for Phase 6

Do not state “fixed” solely because the build passes. Record browser workflow verification.

---

## 9. Delivery format

Return:

1. Complete updated repository ZIP
2. `docs/PRE_PHASE_6_STABILIZATION_REPORT.md`
3. Brief summary of:
   - Root cause
   - What changed
   - Type/build result
   - Browser/database verification status
   - Whether Phase 6 is now safe to start

Do not return only snippets or a plan.
