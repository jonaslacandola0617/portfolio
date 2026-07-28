# Admin UI and Dashboard Polish Report

Date: 2026-07-28

## 1. Previous UI problems -

- Individual, row, bulk, and media deletion used `window.confirm()` / `confirm()`.
- The parent admin loading boundary showed one list-shaped placeholder for dashboards, editors,
  structured forms, media, and Settings.
- The dashboard exposed four totals, stale Phase 1 copy, a false zero-state on database failure,
  and an empty panel labeled “Recent Activity” even though no activity persistence exists.

## 2. Reusable destructive dialog

`components/admin/delete-confirmation-dialog.tsx` is the single destructive confirmation surface.
`DeleteButton`, management-list row deletion, bulk deletion, and media deletion compose it.

It uses the existing Radix Dialog dependency and provides:

- dark card/border styling with a restrained destructive accent;
- content-type label, record title/count, consequence copy, and responsive button layout;
- focus trap, Cancel as initial focus, Escape/outside-click close only while idle, and focus
  restoration;
- an open pending state with spinner, disabled Cancel/close/confirmation, and duplicate-submit
  prevention;
- an assertive inline failure region inside the dialog;
- close/refresh/navigation only after the structured Server Action result confirms success.

All six content-type single-delete actions now validate ids with `deleteIdSchema`; bulk actions keep
`bulkDeleteSchema`. Every action still calls `requireAdmin()`, catches/logs safe context, returns a
structured result, and revalidates affected routes. Media deletion now follows the same contract and
no longer converts a failed media query into an empty library.

`rg 'window\.confirm|\bconfirm\(' app components lib` returns no matches.

## 3. Loading-boundary architecture

The admin layout remains mounted. The root dashboard boundary is dashboard-shaped; narrower route
segments select reusable skeletons matching their final page. `NavigationProgress` adds a
non-blocking two-pixel primary progress line immediately after an internal admin link click and
clears it when the pathname resolves. Suspense/loading boundaries remain the authoritative loading
state.

### Skeleton inventory

- `AdminListSkeleton`: Projects, Labs, Journal, Certificates, Timeline, Skills.
- `AdminEditorSkeleton`: Project, Lab, Article, and Certificate rich editors; its `richText={false}`
  variant covers Timeline and Skill structured forms.
- `DashboardSkeleton`: heading, six metric cards, status/attention panels, recent rows, quick actions.
- `MediaLibrarySkeleton`: upload surface and file-card grid.
- `SettingsSkeleton`: identity, contact, social, and currently-learning field groups.
- `PublicListSkeleton`: Projects, Labs, Journal, Certifications, and tag results.
- `PublicDetailSkeleton`: Project, Lab, and Article details.

Specific `loading.tsx` files exist for every requested admin list, `[id]`, and `new` segment, plus
Media and Settings. Public list/detail boundaries were added only to database-backed collection and
detail routes.

## 4. Error state

`app/admin/(dashboard)/error.tsx` remains inside the admin shell. It now uses a styled technical card,
safe wording, keyboard-operable Retry and Back to dashboard controls, a digest-only reference, and
safe contextual client logging (`operation`, error type, digest) rather than dumping the full error
object.

## 5. Completed dashboard

The dashboard now includes all six managed content types:

- Projects: total, published, draft, in progress.
- Labs: total, published, draft, in progress.
- Articles: total, published, draft, scheduled.
- Certificates: total, published, in progress, completed.
- Timeline: total, published, draft, latest entry date.
- Skills: total, group count, comfortable/advanced count, largest group.

The live database rendered: Projects 4, Labs 4, Articles 4, Certificates 4, Timeline 10, Skills 37.

The publication panel groups real statuses across the five publishable models. It shows 26 published,
0 draft, 0 scheduled, and 0 archived in the verified database. When scheduled items exist, it
truthfully states that automatic publication is not configured.

Recently Updated Content merges limited `updatedAt` selections from Projects, Labs, Articles, and
Certificates, sorts them descending, and caps the result at eight. Timeline and Skill are omitted
because their current schema has no `updatedAt`. The panel explicitly says it is timestamp-derived
and is not an Activity Log.

Needs Attention uses reproducible queries:

- drafts unchanged for more than 30 days;
- published projects without thumbnails;
- published projects, labs, or articles without tags;
- scheduled records while automatic publishing is unavailable;
- completed, published certificates without credential links.

Zero-count checks are omitted. Current data reports four published projects without thumbnails.
Quick Actions provide compact links for new Project, Lab, Article, Media upload, Settings, and the
public site.

## 6. Dashboard data and health

`lib/services/dashboard-service.ts` is server-only and owns all dashboard database access. Independent
top-level sections run in parallel and return typed success/failure sections. A failed optional panel
renders a localized failure instead of a fake zero and does not discard successful sections.

Database health uses a dedicated lightweight `SELECT 1`:

- Connected: health probe and all panels succeeded.
- Degraded: health probe succeeded but a panel failed.
- Unavailable: health probe failed.

No database URL, hostname, or credential is sent to the client. Count/group queries are used instead
of full-record loads; Recently Updated selects only required fields and has bounded per-model and
merged limits. No persistent dashboard caching was introduced.

## 7. Browser and accessibility verification

Authenticated development-browser checks:

- Project row Delete opened the custom dialog with exact record context.
- Bulk Delete opened the count-aware dialog.
- Cancel and Escape closed without mutation.
- Cancel received initial focus; Escape restored focus to the trigger.
- The dialog was focus-trapped by Radix.
- A disposable draft named `Codex UI Delete Verification` exercised confirmed deletion.
- The button changed to `Deleting...` while the action was active.
- The dialog stayed open during the action, closed only after success, and the list refreshed from
  five records back to the original four.
- The disposable record was confirmed absent after refresh.
- No native JavaScript dialog appeared.
- The same component is used by edit-page deletes for all six forms and Media.

Responsive checks used 390×844, 768×900, and 1440×900 viewports. The dashboard and dialog remained
inside the viewport with no horizontal overflow. At 390px the dialog measured approximately 358px
wide with 16px side clearance and reachable stacked actions. Tablet and desktop card grids resolved
to the expected responsive columns.

Production public-route checks passed for home, project/lab/article lists and details,
certifications, and the networking tag. The automated running-site verifier confirmed every
database-backed detail route, search payload, tag result, and sitemap entry.

The styled error boundary and inline deletion failure branch were statically/type verified. A real
Neon outage was not deliberately induced because that would disrupt the owner’s database; the
dashboard’s independent settled-result branches and destructive dialog failure branch remain
directly testable without changing the security model.

## 8. Verification commands and results

```text
npm ci
PASS — 848 packages installed; postinstall Prisma generation passed.
NOTE — npm reports 16 high-severity transitive advisories; no forced dependency upgrade was made.

npm run db:generate
PASS — Prisma Client 6.19.3 generated.

npx tsc --noEmit
PASS

npm run lint
PASS — no warnings or errors.

npm run build
PASS — strict content/database checks passed; 73/73 static pages generated.

SITE_VERIFY_URL=http://127.0.0.1:3000 npm run verify:site
PASS — projects=4, labs=4, articles=4, certificates=4, tags=29,
sitemapUrls=51; routes/search/tags/sitemap all OK.
```

One verifier attempt encountered a transient Neon pooled connection closure and a second used the
wrong environment-variable name. The correctly configured bounded retry passed; neither failure was
converted into fake content counts.

## 9. Files changed in this pass

- Dialog and delete clients:
  `components/admin/delete-confirmation-dialog.tsx`, `delete-button.tsx`,
  `management-list.tsx`, `media-card.tsx`.
- Delete validation/actions:
  `lib/validations/admin.ts`, `lib/services/media-admin-service.ts`, and Projects/Labs/Journal/
  Certificates/Timeline/Skills `actions.ts`.
- Dashboard:
  `app/admin/(dashboard)/page.tsx`, `lib/services/dashboard-service.ts`, `types/admin.ts`.
- Loading/progress/error:
  five admin skeleton components, two public skeleton components, `navigation-progress.tsx`,
  admin layout/error, and the route-specific admin/public `loading.tsx` boundaries.
- Documentation: this report and focused `ARCHITECTURE.md` updates.

## 10. Deferred / remaining

- A persistent Activity Log remains intentionally unimplemented.
- Automatic scheduled publishing remains unconfigured.
- Route query-parameter filters for attention links are not added; links open the relevant
  management list.
- Timeline and Skill cannot appear in Recently Updated until their schema gains an `updatedAt`
  column through an approved migration.
- No chart library, persistent dashboard cache, selectable template cards, or broader Phase 6 work
  was introduced.
- The existing 16 high-severity npm audit findings require a separately scoped dependency upgrade
  review.
