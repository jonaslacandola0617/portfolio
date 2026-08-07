# Phase 5 Report — Media Library, Templates, Admin Search, Settings

Scope (from `docs/CMS_MIGRATION_PLAN.md`'s roadmap): Media Library (Vercel Blob), content
templates, admin search, Settings screen. All four are built. Two things happened during this
phase worth reading before the feature-by-feature detail: a sandbox infrastructure incident (§1)
and a real critical security finding (§3). Neither is a footnote.

## 1. Infrastructure incident: the sandbox container reset mid-phase

Partway through this phase, the sandbox's ephemeral filesystem (`/home/claude`) was wiped — a
genuine container recycle, not something I triggered. Every file from Phases 0-4 briefly
disappeared. This is disclosed plainly because the alternative — quietly re-doing the work and
saying nothing — would misrepresent what happened.

**Recovery:** `/mnt/user-data/outputs/` is separate, persistent storage tied to this conversation,
and still had `cyber-portfolio-phase4-full.zip` — the complete, fully-verified state through Phase
4's CRUD replication. I restored the project from that zip, ran `npm install` and `npx tsc
--noEmit` to confirm the restore was clean, then re-created the handful of Phase 5 files I'd
already written before the reset (templates, the Settings query/service/form, admin search) from
memory of what I'd just built, verifying each against `tsc` again as I went. Nothing was lost
except `node_modules` (trivially reinstalled) and about 20 minutes of redone — not re-designed —
work. Everything from Phase 0 through Phase 4 in this delivery is the same code delivered in
`cyber-portfolio-phase4-full.zip`, unchanged.

**Practical implication for you:** treat `/mnt/user-data/outputs/` zips as the durable record of
this project, not this sandbox's working directory. If you want a guarantee against this
recurring, committing each phase's delivered zip to your own git repository (which you'd be doing
anyway before deploying) makes this a non-issue going forward.

## 2. Feature-by-feature

**Templates** (`lib/editor/templates.ts`) — Project/Lab/Article each get a pre-structured
document (H2 section headings matching the original brief's per-content-type template spec —
Overview/Objectives/.../Lessons Learned for Projects, Purpose/Devices/.../Lessons Learned for
Labs, Summary/Body/.../References for Articles) instead of a blank page, wired into each admin
service's `create` function. Certificates start genuinely empty — their `content` field is
optional (`Json?`) precisely because not every certificate needs a write-up, so imposing template
sections there would fight the schema's own design.

**Admin search** (`components/admin/admin-search-dialog.tsx`, Cmd+K in the admin sidebar) —
searches Projects/Labs/Articles/Certificates by title across *every* publish status, including
drafts, which is the entire reason this is a separate implementation from the public search
(`hooks/use-search.tsx`) rather than a shared one — the public search only ever indexes published
content, and that's correct for a search a site visitor uses.

**Settings** (`/admin/settings`) — edits the `SiteSettings` singleton row: name, role, tagline,
email, GitHub/LinkedIn URLs, resume path, and the home page's "Currently Learning" list (parsed
from a `Label | /href`-per-line textarea, not a dynamic add/remove list UI — a real, deliberate
simplification, not an oversight). **The public site was actually cut over to read from it**,
not just the admin form built in isolation: `app/layout.tsx` (metadata + the identity fields
feeding the sidebar/nav), `app/page.tsx` (hero name/role/tagline, resume link, Currently Learning
widget), `app/contact/page.tsx` + `components/shared/contact-form.tsx` (email, social links),
`app/resume/page.tsx` (resume path). Every one of these calls `lib/db/queries/settings.ts`'s
`getSiteSettings()`, which fails open to the original static `lib/site-config.ts` values if
Postgres isn't reachable — same resilience pattern every query-layer function has followed since
Phase 2. **Verified this actually works, not just reads correctly:** live-tested the homepage in
this sandbox (where Prisma genuinely can't connect) and confirmed it still renders the static
fallback name correctly rather than crashing or showing blank — see §4.

Two fields stayed static on purpose: `siteConfig.currentFocusStack` (the About page's skill
badges) and `siteConfig.stats` (the home page's stat counters) aren't in the `SiteSettings` schema
and weren't added — they're lower-frequency-change data than name/bio/links, and expanding the
schema for them wasn't asked for. Easy to add later following the exact pattern already
established if that's wanted.

**Media Library** (`/admin/media`) — drag-and-drop or click-to-browse upload
(`components/admin/media-upload.tsx`) using Vercel Blob's client-direct-upload flow: the browser
gets a short-lived signed token from `app/api/admin/media/upload/route.ts` (the one new API-route
exception this phase — see `ARCHITECTURE.md` rule #4), then uploads straight to Blob storage,
never routing the file through this server. A grid (`components/admin/media-card.tsx`) shows
uploaded files with copy-URL and delete actions. One implementation detail worth flagging: Vercel
Blob's `onUploadCompleted` webhook — the "official" way to learn an upload finished — does **not**
fire against `localhost`, since it's Vercel's servers calling back to yours, and they can't reach
a local dev machine. Rather than build something that only works after a production deploy, the
Media record is created by a Server Action (`createMediaRecordAction`) called directly from the
browser the moment `upload()` resolves — reliable in local dev, staging, and production alike.
The webhook handler is still there as a best-effort log, not the load-bearing path.

**Not built:** a picker to attach Media (e.g., a thumbnail) to a specific Project/Lab/etc. from
their edit forms. The Library exists and functions as a standalone feature — upload, browse, copy
a URL, paste it into a field by hand for now. Wiring a proper picker into `project-form.tsx` and
friends is a natural next increment, not attempted here to keep this phase's scope to what was
asked (a Media Library), not a redesign of every other content type's form.

## 3. Security finding: critical `next-auth`/`@auth/core` advisories, fixed

Routine `npm audit` after this phase's dependency changes turned up **2 critical-severity**
advisories in `next-auth`/`@auth/core` — the packages powering every `/admin` auth check in this
project. Summary: a configuration-error path in the version I had installed (`5.0.0-beta.31`,
installed back in Phase 0) could make existence-based authorization checks fail open under
specific misconfiguration conditions, rather than fail closed. This is exactly the failure
direction to never accept in an auth library, and directly relevant given how much of this
project's own design (query-layer functions failing open to empty data) depends on "fail open"
being the *safe* default — for auth specifically, the safe default is the opposite, and it's the
library's job to get that right.

**Fixed** by upgrading to `5.0.0-beta.32` (`npm install next-auth@beta`) — confirmed via `npm
audit` that both critical findings are gone post-upgrade, confirmed via `npx tsc --noEmit` and a
full rebuild that nothing broke. Still no stable (non-beta) `next-auth` v5 release exists —
checked again this phase, matching Phase 0's original finding — so this remains a dependency
worth auditing on a normal cadence going forward, not a one-time fix. Noted as a standing
architectural concern in `ARCHITECTURE.md` §3, not just this report, so it doesn't get lost.

One unrelated, lower-stakes finding from the same audit pass: bumping `next-auth` triggered a
broader dependency re-resolution that surfaced 16 high-severity advisories in `eslint`/
`eslint-config-next`'s own transitive dependency tree (`glob`, `minimatch`, `brace-expansion`,
`rimraf`, etc.). Confirmed all 16 are `eslint`-only — a devDependency, never bundled into the
production build, never executed at runtime — and tied to the same deferred Next.js
major-version-bump decision flagged every phase since Phase 0. Left deferred for the same reason:
it's a real decision with its own testing surface, not something to fold into a security patch.

## 4. Build & verification

`npx tsc --noEmit` — clean throughout, checked after each feature (templates, then settings, then
admin search, then media library) rather than only at the end.

**Full build:**

```
Compiled successfully
Generating static pages (32/32)
```

New routes: `/admin/media` (~150 kB, includes the Blob client SDK), `/admin/settings` (~99 kB, no
editor — it's a plain form), `/api/admin/media/upload` (0 B, route handler). Every prior route's
size is unchanged.

**Live-tested** (`next start`): `/admin/media` and `/admin/settings` correctly redirect
unauthenticated requests to `/admin/login` (307); the upload API route correctly rejects a
malformed/unauthenticated request (400, not a 500 or a hang); every previously-built admin CRUD
route is still protected; the full public site — all 6 content types plus
`/about`/`/resume`/`/contact` — still returns 200. And specifically for the Settings cutover: the
homepage was confirmed live to render "Alex Rivera" (the static fallback name), proving the
fail-open path genuinely works end-to-end in exactly the "database unreachable" condition this
sandbox has been stuck in since Phase 0 — not just that the code compiles, that it does the right
thing when the thing it's falling back from actually fails.

**What's still not verifiable here, unchanged from every prior phase:** no real browser to
actually drag a file into the Media Library or click through the Settings form, and
`binaries.prisma.sh` is still unreachable for a real `prisma generate`/migrate/seed cycle. What's
new to this phase's version of that limitation: Vercel Blob uploads additionally need a real
`BLOB_READ_WRITE_TOKEN` and a reachable Blob store, which this sandbox has neither of — so the
upload flow's code is correct against Vercel's documented API (verified via a live doc search
during this phase, not from memory) and compiles/bundles correctly, but an actual file upload is
something only you can complete, the same category of gap as every other "needs real credentials
and a real browser" limitation in this project.

## 5. What's still open going into Phase 6

- Media picker UI for attaching uploads to content (§2)
- `siteConfig.currentFocusStack`/`.stats` remain static, not Settings-editable (§2)
- Project <-> Certificate linking UI (flagged in the Phase 4 CRUD-replication report, still open)
- Dashboard stat cards still only cover 4 of 6 content types (same standing note)
- Everything Phase 4 already flagged as out of scope for the editor itself (slash commands,
  drag-and-drop reordering, syntax highlighting)

Per the roadmap, Phase 6 is cleanup, a caching pass, and writing this CMS up as a showcased
Project on the very portfolio it powers. Waiting for direction before starting it.
