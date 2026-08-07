# Phase 4 Report — TipTap Editor + Full Projects CRUD

Scope (from `docs/CMS_MIGRATION_PLAN.md`'s roadmap): admin CRUD + TipTap editor, autosave, publish
workflow. **Explicit scope decision made partway through, flagged here rather than left implicit:
built the editor infrastructure completely (applies to every content type), and full CRUD for
Projects specifically as the proof of pattern — not all 6 content types.** §4 explains why and
what's left.

## 1. Files changed

### New — editor infrastructure (content-type-agnostic, not Projects-specific)

```
types/tiptap.ts                         Modified — added taskList/taskItem node types
lib/validations/content.ts               Modified — added taskList/taskItem Zod schemas
components/shared/content-renderer.tsx    Modified — added table + taskList rendering
prisma/seed/mdx-to-tiptap.ts              Modified — GFM task-list detection (- [ ]/- [x])

lib/editor/extensions.ts                 The shared extension list — editor's contract with
                                          the JSON schema, same role content-renderer.tsx plays
                                          for reading it
lib/editor/extensions/callout.tsx         Custom Node + React NodeView
lib/editor/extensions/command-block.tsx    Custom Node + React NodeView
lib/editor/extensions/mermaid.tsx           Custom Node + React NodeView (source/preview toggle)

components/editor/toolbar.tsx             Formatting/insert toolbar
components/editor/editor-shell.tsx         useEditor wrapper, wires toolbar + autosave together
components/editor/save-status.tsx           Saving/Saved/Unsaved/error indicator

hooks/use-autosave.ts                     Debounced autosave (2s) + status tracking + saveNow()
```

### New — Projects CRUD specifically

```
lib/validations/project.ts                Zod schema for the admin form/Server Action payload
lib/services/project-admin-service.ts       Admin mutations (create/update/delete) + admin-only
                                            reads (every status, not just PUBLISHED)
app/admin/(dashboard)/projects/actions.ts    Server Actions — every one calls requireAdmin() itself
app/admin/(dashboard)/projects/new/page.tsx
app/admin/(dashboard)/projects/[id]/page.tsx
components/admin/project-form.tsx           Metadata form + embedded EditorShell for content
```

### Modified

| File | Change | Why |
| --- | --- | --- |
| `app/admin/(dashboard)/projects/page.tsx` | Placeholder → real admin list view (`getAllProjectsForAdmin`, status badges, link to edit) | The planned cutover |
| `package.json` | Added `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-{link,table,table-row,table-cell,table-header,task-list,task-item,placeholder}`, `@tiptap/suggestion` | The editor itself |

### Confirmed untouched

Everything from Phases 0-3 — public pages, the query layer, the seed script's core logic (only
the converter's list-handling changed, additively). Labs/Articles/Certificates/Timeline/Skills
admin pages are byte-for-byte the same placeholders from Phase 1.

## 2. Editor architecture

**Standard rich text is official TipTap extensions, configured to match the existing schema
exactly** rather than producing new node shapes I'd then have to reconcile: `@tiptap/starter-kit`
already emits `paragraph`/`heading`/`bulletList`/`orderedList`/`listItem`/`codeBlock` with the same
names `types/tiptap.ts` already used; `@tiptap/extension-table*` emits
`table`/`tableRow`/`tableCell`/`tableHeader`; `@tiptap/extension-link` is a `link` mark with
`attrs.href`. None of this required new schema work — Phase 2/3's schema was already designed
against TipTap's real node-naming conventions, which paid off here.

**Task lists are new this phase** — the original CMS brief wanted them, but no migrated content
used them, so Phases 2-3 had no reason to build support. Added `taskList`/`taskItem` to the type
schema, Zod validator, `ContentRenderer`, and the seed-time converter (GFM `- [ ]`/`- [x]` syntax)
in the same pass as wiring up the editor's `TaskList`/`TaskItem` extensions, so all four layers
agree from the start rather than catching a gap later the way Phase 2/3 repeatedly did with other
fields.

**The 3 blocks with no official TipTap equivalent — `Callout`, `CommandBlock`, `Mermaid` — are
hand-written `Node` extensions, each with a React NodeView that reuses the exact same display
component `ContentRenderer` uses for that node type** (`components/shared/callout.tsx`,
`command-block.tsx`, `mermaid-diagram.tsx` — all untouched since their original build). This is
the concrete mechanism behind "what you see while editing is what renders publicly" — not a
policy, an actual shared-component fact. `CommandBlock`'s NodeView is a title input + one-line-
per-command textarea; `Mermaid`'s is a source/preview toggle (edit the raw chart text, or see it
rendered); `Callout`'s wraps its children in `NodeViewContent` so the callout's body stays real,
editable rich text rather than a plain-text field.

**No slash-command menu, no drag-and-drop block reordering.** Both were in the original CMS
brief's "Notion-like" feature list. Insertion happens via the toolbar instead — click a button,
the block appears at the cursor. This is a real, working, complete way to build a document; it's
just not the fuzzy-search "/command" pattern Notion popularized. Given the size of this phase
already (editor infrastructure + one full CRUD flow), I scoped these out explicitly rather than
ship a half-working slash menu — `@tiptap/suggestion` is installed (that's the package the real
implementation would build on) but unused. Worth a dedicated follow-up if the toolbar-only flow
feels limiting in practice.

**No syntax highlighting in code blocks — anywhere, editor or public site.** This is a real
regression worth naming plainly: the original MDX pipeline had it (`rehype-pretty-code` +
`shiki`, removed in Phase 3 along with the rest of the MDX toolchain). Re-adding it wasn't in this
phase's stated scope (admin CRUD + editor + autosave + publish workflow), and highlighting
libraries add real bundle weight — not something to bring back without a decision to make it a
priority, not a side effect of building the editor.

## 3. Autosave & publish workflow

Autosave is debounced 2 seconds after the last edit (`hooks/use-autosave.ts`), calling
`autosaveProjectContentAction` — which re-validates the incoming JSON against
`projectContentSchema` (the same `lib/validations/content.ts` schema the seed script validates
against) before writing, so a malformed editor payload is rejected the same way a bad migration
write would be, not trusted just because it came from the editor. A "Save now" button bypasses the
debounce for anyone who doesn't want to wait it out before navigating away.

Publish workflow is a plain `publishStatus` select in the metadata form (Draft/Published/
Archived/Scheduled) — changing it and saving calls `updateProjectMetadata`, which only stamps
`publishedAt` the moment status *becomes* `PUBLISHED` (not on every subsequent edit — see the
comment in `project-admin-service.ts`), and calls `revalidatePath` for `/projects`,
`/projects/[slug]`, `/`, and `/sitemap.xml` so a publish goes live without a redeploy, per
`ARCHITECTURE.md` §4's on-demand-ISR plan from Phase 0.

## 4. Scope decision: Projects CRUD only, not all 6 content types

The editor infrastructure (§2) is genuinely content-type-agnostic — nothing in
`lib/editor/extensions.ts`, the 3 custom Node extensions, the toolbar, or the autosave hook is
Projects-specific. What's Projects-specific is `lib/validations/project.ts`,
`lib/services/project-admin-service.ts`, the Server Actions, and `project-form.tsx` — the CRUD
layer on top of the editor.

Replicating this to Labs/Articles/Certificates/Timeline/Skills is mechanical repetition of a
proven pattern, not new design work, but it's still 4-5 more Zod schemas, service files, Server
Action files, and form components, each with its own field set (Labs have `purpose`/`labDate`
instead of `summary`/`completionDate`; Certificates barely use the editor at all, being mostly
scalar fields; Timeline has no natural slug, same issue the seed script already solved once).
Given the size of what's already in this delivery, I stopped after Projects rather than build 5
more CRUD flows without you having seen the pattern work first — this felt like the right point to
check in, the same instinct that scoped Phase 2 down to one content type before Phase 3 repeated
it four times in one pass with much higher confidence.

## 5. Build & type verification

`npx tsc --noEmit` — clean, after fixing two real bugs:

1. **A JSDoc comment containing a literal `*/` sequence** (referring to files under
   `lib/editor/extensions/` using a glob pattern) silently terminated the block comment early,
   turning the rest of the comment into invalid top-level code. Caught immediately by `tsc`, not
   something that would have reached a build.
2. **Prisma Client's ungenerated stub loses type information the same way described in every
   prior phase's report** — `getAllProjectsForAdmin`/`getProjectForEdit` needed the same
   hand-rolled-interface treatment as `lib/db/queries/projects.ts` got in Phase 2. Applied
   identically; swap for real `Prisma.ProjectGetPayload<...>` once `prisma generate` runs for
   real, same note as every prior phase's version of this fix.

**Full build:**

```
✓ Compiled successfully
✓ Generating static pages (26/26)
```

`/admin/projects/[id]` and `/admin/projects/new` are ~255 kB first-load JS — the two routes that
bundle the full editor (ProseMirror + extensions), versus ~89-98 kB for every other admin/public
route. That's the real, isolated cost of the editor; it doesn't leak into any page that doesn't
use it, including every other `/admin/*` placeholder.

**Live-tested** (`next start`): `/admin/projects` and `/admin/projects/new` correctly redirect to
`/admin/login` when unauthenticated (307, same as every other admin route since Phase 1); every
public page — including all 6 content types and the never-touched `/about`/`/resume`/`/contact`
— still returns 200, confirming this phase's admin-only additions didn't disturb anything.

**What I could not test, and why, honestly:** the editor's actual interactive behavior — typing,
toolbar clicks, NodeView editing, autosave firing — needs a real browser executing client-side
JavaScript against a live DOM. This sandbox has neither a browser nor (per every prior phase's
standing limitation) a working Prisma Client to populate real admin data to edit in the first
place. What's verified is real: the bundle compiles and ships at a reasonable size, every type in
the chain (editor JSON → Zod → Prisma write → Zod on read → renderer) is consistent end to end by
construction, and the surrounding page-level auth/routing behavior is confirmed live. The editor's
in-browser behavior is the one thing only you can verify, the same category of gap as Phase 1's
OAuth login — not something a sandboxed environment can close no matter how thoroughly I test
everything around it.

`npm audit`: still 5 findings, all pre-existing and already tracked (`next`, `postcss`,
`eslint-config-next` and its dependents — the deferred Next.js major-version-bump decision from
Phase 0, untouched this phase). Nothing new from the TipTap packages.

## 6. Blockers before Phase 5

**Same standing one:** `binaries.prisma.sh` unreachable here. Once your Neon credentials are in
place and `npm run db:seed` has run for real, `/admin/projects` will show your actual 4 migrated
projects instead of an empty list, and editing one will load its real content into a real,
interactive editor — which is the point at which the one untestable piece from §5 becomes
verifiable, by you.

**A genuine decision point, not a blocker:** whether to replicate CRUD to the remaining 5 content
types before or after Phase 5 (Media Library, templates, admin search, Settings). Both orderings
work; Phase 5's Media Library is more useful once there's more than one CRUD flow to attach images
to, but templates are specifically about *not* starting from a blank editor, which matters most
for exactly the content types that don't have CRUD yet. Your call on ordering.

Waiting for your direction before continuing.
