# Phase 1 Report — GitHub OAuth, Admin Shell, Architectural Layers

Scope: the pre-Phase-1 architectural adjustments (ARCHITECTURE.md, query layer, service layer,
Zod convention, Server-Actions-first, reserved architecture for Activity Log/Settings/Revisions),
then the approved Phase 1 build (GitHub OAuth, middleware, `/admin` layout, dashboard shell,
navigation, session handling, protected routes). No CRUD, no TipTap, no content migration, no
public-page changes — confirmed below.

## 1. Files changed

### New

```
ARCHITECTURE.md

middleware.ts

lib/validations/env.ts
lib/db/queries/projects.ts
lib/db/queries/labs.ts
lib/db/queries/articles.ts
lib/db/queries/certificates.ts
lib/db/queries/activity.ts
lib/services/dashboard-service.ts
lib/services/auth-service.ts

types/admin.ts

components/layout/site-chrome.tsx
components/admin/admin-sidebar.tsx
components/admin/sign-out-button.tsx
components/admin/stat-card.tsx
components/admin/empty-state.tsx
components/admin/placeholder-page.tsx

app/admin/login/page.tsx
app/admin/login/actions.ts
app/admin/(dashboard)/layout.tsx
app/admin/(dashboard)/page.tsx
app/admin/(dashboard)/{projects,labs,journal,certificates,timeline,skills,media,settings}/page.tsx
```

### Modified

| File | Change | Why |
| --- | --- | --- |
| `lib/db.ts` | `PrismaClient` construction made lazy (Proxy-based) instead of a module-scope `new PrismaClient()` | Found by actually running the build — see §3, this isn't cosmetic |
| `auth.ts` | `signIn` callback now calls `getAdminEmail()` (Zod-validated) instead of reading `process.env.ADMIN_EMAIL` directly | Establishes the Zod-at-trust-boundaries convention concretely, not just in docs |
| `app/layout.tsx` | Chrome (Sidebar/MobileNav/SearchDialog/skip-link) extracted into `<SiteChrome>`, replacing the inline JSX | The one change needed to keep `/admin` from inheriting the public sidebar — see §2 |
| `package.json` | Added `zod`, `server-only` | New layer dependencies |
| `prisma/schema.prisma` | *No changes this phase* — reserved-architecture comments already covered Activity Log/Revision History in Phase 0; Site Settings table already existed | Confirmed nothing needed adding for the "reserve architecture" requirement beyond what Phase 0 already had |

### Confirmed untouched

Every existing public route (`app/page.tsx`, `app/about/`, `app/projects/`, `app/labs/`,
`app/journal/`, `app/certifications/`, `app/timeline/`, `app/skills/`, `app/resume/`,
`app/contact/`, `app/tags/`) and every file under `components/ui/`, `components/shared/`,
`components/layout/sidebar.tsx`, `components/layout/mobile-nav.tsx` — zero diffs. Verified by
build output (§3) and live requests (§3), not just by not having opened them.

## 2. Architecture decisions

**Query layer (`lib/db/queries/`).** Five files, one per content type the dashboard needs a count
for, plus `activity.ts`. Each has `import "server-only"` at the top — an accidental import from a
Client Component now fails the build instead of silently bundling a database call into
client-side JS. This is enforcement, not just a naming convention.

**Service layer (`lib/services/`).** Two files: `dashboard-service.ts` orchestrates five query
calls into one `DashboardOverview` shape (real business logic — deciding what "the dashboard
needs" means, and degrading gracefully if the DB isn't reachable); `auth-service.ts`'s
`requireAdmin()` is the second, redundant auth check described below. Nothing about "business
logic lives in services" required much invention this phase — there simply isn't much business
logic yet, since there's no CRUD — but the pattern is real and load-bearing, not a stub.

**Zod validation.** No forms exist yet to validate (OAuth is a redirect, not a form submission),
so `lib/validations/env.ts` is the one real usage this phase: it validates `ADMIN_EMAIL` — the one
env var that's genuinely this project's business logic, as opposed to `AUTH_SECRET`/
`AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`, which Auth.js validates itself with its own clear errors.
Deliberately **lazy** (a function called inside the `signIn` callback, not a module-level
`.parse()` call) — an eager version would couple `next build` to having `ADMIN_EMAIL` set, which
would make the public site's build depend on an admin-only secret. Confirmed this distinction
matters in practice, not just in theory — see the `lib/db.ts` bug in §3, which is the same class
of mistake in a different file.

**Server Actions over API routes.** `app/admin/login/actions.ts` (`signInWithGitHub`) and
`components/admin/sign-out-button.tsx` (inline `"use server"` action) are both Server Actions, not
client-side calls to an API route. The one API route this phase (`/api/auth/[...nextauth]`,
already built in Phase 0) is the documented exception — GitHub's OAuth callback is an external
redirect to a fixed URL, which a Server Action can't be a target for.

**Public/admin chrome separation.** This was the one real design decision this phase, and it's
worth explaining because I didn't take the "obvious" path. The obvious path is: move every public
route into `app/(site)/` so it can have its own root-ish layout, cleanly separate from
`app/admin/`. I didn't do that — it touches the file location of every existing public page for a
problem that's solvable by changing one file instead. `components/layout/site-chrome.tsx` is a
small Client Component that checks `usePathname().startsWith("/admin")` and either renders the
public `Sidebar`/`MobileNav`/`SearchDialog`, or renders `children` bare. `app/layout.tsx` now
wraps `children` in `<SiteChrome>` instead of the chrome JSX directly. Zero public route files
moved or renamed. Verified with live requests that neither leaks into the other (§3).

**Reserved architecture — re-confirmed, nothing new needed.** Activity Log
(`lib/db/queries/activity.ts` → typed empty array → dashboard's empty state), Site Settings (table
already existed from Phase 0; `/admin/settings` is a placeholder pointing at it), and Revision
History (comment-only sketch in `schema.prisma`, unchanged this phase) were all already
architecturally accounted for before Phase 1 started. I re-checked each one against this phase's
actual code rather than assuming the Phase 0 groundwork was still sufficient, and it was.

## 3. Build verification

`npx tsc --noEmit` — clean, zero errors, both before and after the fix described next.

**Found a real bug by actually building, not just type-checking:** `lib/db.ts`'s original
`export const prisma = new PrismaClient()` runs at module-import time. When the generated Prisma
Client doesn't exist yet (true in this sandbox — see the Phase 0 report's network limitation,
still unresolved — and also true for anyone deploying this before their first successful `prisma
generate`), that constructor throws *synchronously*, before any try/catch has a chance to run,
because module-level code executes during Next.js's page-data-collection step, not inside a
request handler. First build attempt failed outright: `Error: @prisma/client did not initialize
yet` during `Collecting page data` for `/admin`, took down the entire build, not just that route.

Fixed by making `prisma` a `Proxy` that defers `new PrismaClient()` to first actual property
access — which now happens inside `getProjectCount()` etc., inside
`dashboard-service.ts`'s `try` block, where it was always supposed to be caught. Rebuilt clean
afterward. Full detail and reasoning is in the comment block in `lib/db.ts` — flagging it here
because it's a correctness fix that would have bitten a real deploy, not sandbox-specific cleanup.

**Full build, after the fix:**

```
✓ Compiled successfully
✓ Generating static pages (66/66)
```

56 pre-existing public routes at unchanged sizes, plus:

```
ƒ /admin                          ƒ /admin/media
ƒ /admin/certificates              ƒ /admin/projects
ƒ /admin/journal                    ƒ /admin/settings
ƒ /admin/labs                        ƒ /admin/skills
ƒ /admin/login                        ƒ /admin/timeline
ƒ /api/auth/[...nextauth]
ƒ Middleware (91.6 kB)
```

All correctly `ƒ` (server-rendered on demand) — right, since every one is either behind auth or
serves the OAuth flow, none of them should be statically prerendered.

Two benign build warnings, unrelated to anything above: `jose` (next-auth's JWT library) using
`CompressionStream`/`DecompressionStream`, which the Edge runtime doesn't support. These are
compression APIs for encrypted-JWT (JWE) support, a feature we're not using (plain signed JWTs) —
a known, widely-reported cosmetic warning in next-auth v5, not a functional problem.

**Live verification** (`next start`, real HTTP requests, not just a clean build):

```
GET /                        200
GET /projects                200
GET /labs/vlan-trunking-lab  200
GET /journal                 200
GET /timeline                200
GET /skills                  200

GET /admin                   307 → /admin/login
GET /admin/projects          307 → /admin/login
GET /admin/labs              307 → /admin/login
GET /admin/settings          307 → /admin/login
GET /admin/login             200 (not redirected — no loop)
```

Confirmed the login page contains the sign-in form, confirmed public pages don't contain any
admin-only strings, and confirmed the login page's HTML has no leaked public sidebar markup (the
one string it does share with the public site is the `<title>` tag — shared site branding via
Next.js metadata, not a chrome leak).

## 4. Authentication flow explanation

```
1. Visitor requests any /admin/* route
2. middleware.ts runs first (Edge, before rendering):
   - not authenticated (or authenticated but not admin)  → redirect to /admin/login
   - already authenticated as admin                       → request proceeds
3. /admin/login renders (bare — no sidebar, SiteChrome strips public chrome for /admin/*)
   - if already an admin session, redirects straight to /admin (no point re-showing login)
4. Visitor clicks "Sign in with GitHub" → submits app/admin/login/actions.ts's
   signInWithGitHub Server Action → calls Auth.js's signIn("github", { redirectTo: "/admin" })
5. Browser redirects to GitHub's OAuth consent screen
6. GitHub redirects back to /api/auth/callback/github (the one legitimate API route,
   handled by app/api/auth/[...nextauth]/route.ts)
7. Auth.js's signIn callback (auth.ts) fires: compares the authenticated GitHub
   account's email against getAdminEmail() (Zod-validated ADMIN_EMAIL)
   - match      → sign-in succeeds, jwt/session callbacks set isAdmin: true on the token/session
   - no match    → sign-in denied, redirected back to /admin/login?error=AccessDenied
8. On success, a signed httpOnly JWT cookie is set — no database row created anywhere
9. Subsequent /admin/* requests: middleware reads the JWT (via auth()), sees isAdmin: true,
   lets the request through
10. app/admin/(dashboard)/layout.tsx calls requireAdmin() as a second, independent check
    before rendering AdminSidebar or any dashboard content
11. Sign out: components/admin/sign-out-button.tsx's Server Action calls signOut(),
    clearing the cookie, redirecting to /
```

No user table, no session table, no registration flow — a non-admin GitHub account can complete
steps 1–6 (GitHub will happily authenticate anyone), but is rejected at step 7 and never receives
a session.

## 5. Blockers before Phase 2

**None that block starting Phase 2 as scoped** (content migration for Projects, seed script,
`lib/content.ts` cutover, TipTap renderer). Two things worth flagging, both carried over rather
than new:

1. **Still can't run the real Prisma CLI in this sandbox** (`binaries.prisma.sh` unreachable —
   see the Phase 0 report). Phase 2's seed script and the `lib/content.ts` → Prisma cutover for
   Projects can be written and reviewed here, but genuinely running it against real data needs
   your machine or CI, same as Phase 0's migration did. I'll build Phase 2 so that's a clean
   two-command handoff, same as last time.
2. **GitHub OAuth App still needs to exist on your end** before the login flow in this delivery
   is testable end-to-end — flagged in the Phase 0 report, repeating it since Phase 1 is the
   phase where it actually matters. `.env.example` has the exact callback URL to register.

Waiting for your approval before starting Phase 2.
