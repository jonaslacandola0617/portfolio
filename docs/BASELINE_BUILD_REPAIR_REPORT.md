# Baseline Build Repair Report

**Date:** July 26, 2026
**Scope:** `docs/REQUIRED_BASELINE_BUILD_REPAIR.md` — the two blockers the owner reproduced locally
(Prisma JSON type error, Auth.js/Jose Edge Runtime warning). This is the mandatory first task
before Phase 6.

**Status: both blockers fixed at the source and confirmed correct. A fully clean `npm run build`
was reproduced end-to-end using a temporary, local-only patch to work around two pre-existing
sandbox network restrictions (detailed in §4) that are unrelated to the actual code fixes. Neither
patch is part of the delivered repository.**

## 1. Reporting correction (per repair doc §6)

Per `docs/REQUIRED_BASELINE_BUILD_REPAIR.md` §6: the Phase 5 report's "full build passed" claim
did not reproduce in the owner's local environment, and is superseded by this report. As of this
repair: **Phase 5 feature implementation is delivered, the reported build blockers are fixed and
verified, and the baseline is ready for Phase 6** — with the environment caveats in §4 still
applying to *this sandbox specifically*, not to the code.

## 2. Prisma JSON persistence boundary

### Root cause (confirmed against source)

`TipTapDoc` (`types/tiptap.ts`) and TipTap's `JSONContent` are plain interfaces/unions with no
index signature. `Prisma.InputJsonValue` is defined recursively over an indexed
`InputJsonObject`/`InputJsonArray`. TypeScript's structural typing doesn't consider the former
assignable to the latter even though every value either type can hold is plain, JSON-serializable
data — this is a type-level gap, not a runtime one.

### Fix

Added **one** persistence boundary, `lib/prisma-json.ts`, exporting `toPrismaJson<T>(value: T):
Prisma.InputJsonValue`. It round-trips through `JSON.parse(JSON.stringify(value))` rather than
doing a bare `as unknown as Prisma.InputJsonValue` cast — that round-trip is real runtime
normalization (strips `undefined`/functions/symbols, throws on circular references or `BigInt`,
collapses non-finite numbers to `null`), matching the repair doc's "reject or normalize" guidance,
not just a type-level assertion.

Every Prisma `Json`/`Json?` write in the repository now goes through it — searched the whole
repository for `content:`/JSON-field writes rather than stopping at the first reported file:

| File | Write sites updated |
| --- | --- |
| `lib/services/article-admin-service.ts` | `createArticle` (template), `updateArticleContent` |
| `lib/services/project-admin-service.ts` | `createProject` (template), `updateProjectContent` |
| `lib/services/lab-admin-service.ts` | `createLab` (template), `updateLabContent` |
| `lib/services/certificate-admin-service.ts` | `createCertificate` (template), `updateCertificateContent` |
| `prisma/seed/index.ts` | 6 upsert call sites (Projects/Labs/Articles × create+update); also dropped the now-redundant `as object` cast in `convertAndValidate` |
| `lib/services/settings-admin-service.ts` | `upsertSiteSettings` — **not called out in the repair doc**, found by searching every `Json` column in `prisma/schema.prisma`: `SiteSettings.currentlyLearning` (`{ label, href }[]`) has the identical structural mismatch against `Prisma.InputJsonValue`, fixed the same way |

`TipTapDoc` itself was **not** weakened with a broad index signature — it stays the strict type
every renderer/editor/validator uses. Only `toPrismaJson`'s return type is Prisma's, matching the
repair doc's explicit preference against that shortcut.

### Verification

This sandbox cannot run a real `prisma generate` — same restriction every prior phase report
documented (`binaries.prisma.sh` returns `403 Forbidden`; confirmed again this session). Without
it, `@prisma/client`'s generated types don't exist; the fallback stub types `PrismaClient` (and
implicitly every `Prisma.*` reference) as `any`, so `npx tsc --noEmit` against the stub cannot
actually exercise the type error this fix addresses.

To verify the fix's *correctness* rather than just its absence of stub-masked errors, I temporarily
appended a hand-written `Prisma.InputJsonValue`/`InputJsonObject`/`InputJsonArray` declaration to
the stub's `.d.ts` — copied verbatim from Prisma's own publicly documented type shape, not
invented — and re-ran `npx tsc --noEmit` and `npm run build`. Both were clean against that
structurally faithful type. The patch was then fully reverted (`diff` confirmed a byte-for-byte
match against the pre-patch file); it is not part of the delivered repository.

```
$ npx tsc --noEmit          # after the temporary patch
(no output — 0 errors)

$ npx tsc --noEmit          # after reverting the patch, real sandbox state
lib/prisma-json.ts(46,51): error TS2694: Namespace '...".Prisma' has no exported member 'InputJsonValue'.
lib/prisma-json.ts(47,54): error TS2694: Namespace '...".Prisma' has no exported member 'InputJsonValue'.
```

Those 2 errors in the final, delivered state of the repo are **the sandbox's inability to run
`prisma generate`, not a defect in the fix** — confirmed by the exact same 2 errors disappearing
the moment a real `Prisma.InputJsonValue` type is present, and reappearing identically when it's
removed again. A real `npm ci && npm run db:generate` in the owner's environment (which has
network access to `binaries.prisma.sh`) will produce the real generated types and this will simply
compile clean with no further action needed.

## 3. Auth.js/Jose Edge Runtime warning

### Root cause (confirmed against source)

`middleware.ts` called `auth()` from `@/auth` directly, which pulled the full
`next-auth → @auth/core → jose` chain into the Edge Runtime bundle Next.js 14 builds for
Middleware. `jose`'s JWE decompression path (`CompressionStream`/`DecompressionStream`, used when
decrypting the session cookie) isn't an Edge-supported API, hence the warning.

### Fix

Rewrote `middleware.ts` to stop doing real session verification in Edge Middleware. It now:

- Imports only `next/server` — no `@/auth`, no `next-auth`, no `jose` anywhere in the file or its
  import graph.
- Checks whether an Auth.js session cookie is *present* (`authjs.session-token` /
  `__Secure-authjs.session-token` — the exact names confirmed by reading
  `node_modules/@auth/core/lib/utils/cookie.js`'s `defaultCookies()` in this installed version,
  not assumed from memory).
- Redirects to `/admin/login` only when the cookie is entirely absent.

This is explicitly documented in the file's own header comment as an optimization, not an
authorization boundary — a forged or stale cookie passes this check (it only looks at cookie
*names*) but is rejected by the real, cryptographic verification that already existed and is
**unchanged**:

1. `requireAdmin()` in `app/admin/(dashboard)/layout.tsx` — Node.js runtime (not Edge), calls the
   real `auth()`, redirects to login if the session doesn't verify. `CompressionStream` is a
   standard Node global there; no warning, no workaround needed, nothing about this path changed.
2. Every mutation Server Action independently calls `requireAdmin()` again — untouched.
3. `signIn`'s `ADMIN_EMAIL` allow-list in `auth.ts` — untouched.

Confirmed no other file imports `@/auth` from an Edge context: grepped every importer of `@/auth`
(`sign-out-button.tsx`, `admin-sidebar.tsx`, `app/admin/(dashboard)/page.tsx`,
`app/admin/login/{page,actions}.tsx`, `app/api/auth/[...nextauth]/route.ts`,
`lib/services/auth-service.ts`) and confirmed none declare `export const runtime = "edge"` — all
are Server Components, Server Actions, or the one legitimate Auth.js route handler, all Node.js
runtime by default.

### Verification

`npm run build` output (both the temporarily-patched run for full E2E verification, and separately
confirmed by inspecting `middleware.ts`'s final bundle size in the build output) shows **no**
`CompressionStream`/`DecompressionStream` warning anywhere — compare against the original repro in
the repair doc, which showed the warning immediately after "Compiled with warnings." This build
shows a plain `✓ Compiled successfully` with the warning entirely absent, and a `ƒ Middleware
26.6 kB` line with no accompanying warning text.

## 4. Two environment-only obstacles hit during verification (not defects, both worked around
   locally, neither shipped)

Getting an actual `npm run build` to complete in this sandbox required temporarily working around
two things unrelated to the reported blockers:

1. **`prisma generate` can't reach `binaries.prisma.sh`** (403 Forbidden) — same restriction every
   phase report since Phase 0 has documented. Worked around, for verification only, by hand-adding
   a structurally faithful `Prisma.InputJsonValue` type (§2). Reverted before delivery.
2. **`next/font/google` can't reach `fonts.googleapis.com`** — this is a *new* restriction versus
   what earlier phases had (Phase 5's report describes a full successful build in its sandbox,
   which implies font fetching worked then). This sandbox's current network allowlist does not
   include Google Fonts domains. Worked around, for verification only, by temporarily stubbing the
   three `next/font/google` calls in `app/layout.tsx` with plain objects shaped like what
   `next/font` returns. Reverted before delivery — `app/layout.tsx` is byte-for-byte back to its
   pre-patch state (confirmed with `diff`).

Neither of these reflects an owner-environment problem: the owner's local machine and any normal
CI/Vercel deploy have internet access to both domains. Both are disclosed here in the interest of
not silently working around something and claiming an unqualified "build passes."

## 5. Full verification results

```bash
rm -rf node_modules .next
npm ci                      # clean install, succeeds (prisma generate fails during
                             # postinstall exactly as documented — see §4.1; this does not
                             # block npm ci itself, which still completes)
npx tsc --noEmit             # 2 errors, both the stub-client limitation (§2) — verified
                              # as the ONLY errors via the temporary-patch method above
npm run lint                  # ✔ No ESLint warnings or errors
                               # (added .eslintrc.json — next lint had no config committed
                               #  and was prompting interactively; this is a pre-existing
                               #  gap, not something this repair introduced)
npm run build                 # blocked by the Google Fonts network restriction in this
                               # sandbox (§4.2); with that specific, unrelated obstacle
                               # temporarily worked around, produces a fully clean build:
                               # "Compiled successfully", 32/32 static pages, no warnings,
                               # no type errors
npm audit --omit=dev          # 2 high-severity findings, both in Next.js 14.2.35 /
                               # its bundled postcss — see §6
npm audit                     # 16 high-severity findings total, the other 14 are the
                               # same eslint-transitive-dependency findings Phase 5's
                               # report already documented and deliberately deferred
                               # (dev-only, never bundled, tied to the same Next.js
                               # major-version decision)
```

### Security checklist from the repair doc §5

- No `TipTapDoc`/`JSONContent` → `Prisma.InputJsonValue` errors remain **once a real Prisma client
  is generated** — verified via the temporary-patch method; will hold in the owner's environment
  where `prisma generate` actually succeeds.
- No Jose `CompressionStream`/`DecompressionStream` Edge Runtime warning remains — confirmed absent
  from a full build's output.
- `/admin/login` remains reachable — unchanged code path, middleware explicitly exempts it.
- An unauthenticated `/admin` request cannot render protected data — middleware still redirects
  with no cookie present; `requireAdmin()` in the layout still independently blocks rendering even
  if middleware were bypassed entirely. **Not live-browser-tested** — this sandbox has no OAuth
  credentials, no reachable Neon database, and no interactive browser, the same standing limitation
  every prior phase report disclosed. This is a code-review-level and static-verification-level
  confirmation, not a live HTTP/browser test.
- A fake cookie cannot bypass the protected admin layout — by construction: middleware only checks
  cookie *name* presence, never the value; `requireAdmin()` performs the real signature/decryption
  check downstream, unchanged from before this repair. **Not live-tested** for the same
  credential/browser reasons above.
- Every content autosave/create path still stores valid TipTap JSON — `toPrismaJson()` is a
  normalization step *after* the existing Zod validation (`lib/validations/content.ts`), not a
  replacement for it; shape validation is unchanged.
- The public site still builds and renders — confirmed via the full verification build (§4/§5);
  all 6 content types' public routes and `/about`/`/resume`/`/contact` are present in the route
  output with expected sizes.

## 6. Security/dependency findings (new this session)

`npm audit --omit=dev` found **2 high-severity** advisories in Next.js `14.2.35` (and its bundled
`postcss` copy) — a long list of Next.js CVEs (Server Actions, Image Optimizer, cache poisoning,
middleware/proxy redirects, several DoS vectors) that only have a fix path through `next@16.x`, a
breaking major upgrade. Per `PROJECT_HANDOFF.md` §13 and the repair doc's own explicit instruction
("do not perform an uncontrolled framework-major upgrade solely to remove this warning"), **not
upgraded in this repair** — this is the same category of decision Phase 5 already deferred once for
the `eslint` transitive-dependency findings, for the same reason: a real decision with its own
regression-testing surface, not something to fold into a build-blocker fix. Flagging this as a
concrete backlog item for a dedicated, tested Next.js major-version upgrade, separate from Phase 6.

`npm audit` (including devDependencies) shows the same 16 high-severity `eslint`/
`eslint-config-next` transitive findings (`glob`, `minimatch`, `brace-expansion`, `rimraf`)
Phase 5's report already documented and deferred for the identical reason — dev-only, never
bundled into the production build, tied to the same Next.js major-version decision.

## 7. Files added

- `lib/prisma-json.ts` — the shared Prisma JSON persistence boundary.
- `.eslintrc.json` — standard `next/core-web-vitals` config; `next lint` had no committed config
  and was prompting interactively rather than running non-interactively. This is a pre-existing
  gap (present since at least Phase 5), not introduced by this repair; adding it was necessary to
  actually run the "lint" step this repair's own verification checklist requires.
- `docs/BASELINE_BUILD_REPAIR_REPORT.md` — this report.

## 8. Files modified

- `lib/services/article-admin-service.ts`, `project-admin-service.ts`, `lab-admin-service.ts`,
  `certificate-admin-service.ts` — route `content:` writes through `toPrismaJson()`.
- `lib/services/settings-admin-service.ts` — route `currentlyLearning` through `toPrismaJson()`.
- `prisma/seed/index.ts` — route all 6 `content:` upsert writes through `toPrismaJson()`; dropped
  the redundant `as object` cast in `convertAndValidate`.
- `middleware.ts` — rewritten to a cheap, Edge-safe cookie-presence check; no longer imports
  `@/auth`/`next-auth`. Security model unchanged (see §3) — only *where* the cryptographic check
  happens changed (now Node-runtime-only, was previously duplicated into Edge too).
- `ARCHITECTURE.md` — updated to describe both fixes (see that file's own changelog note).

## 9. Files removed

None.

## 10. Remaining work / what a new maintainer should know

- **Get a real `prisma generate` run once** (`npm run db:generate` in an environment with network
  access) — this repair's fix is verified correct against Prisma's real documented type shape, but
  has never compiled against an actual generated client, only a hand-patched stand-in. Low risk
  (the patched type was copied from Prisma's own public type definitions, not guessed), but real
  verification is still better than a faithful reproduction of it.
- **OAuth/Neon/Blob/browser verification is still outstanding**, unchanged from every prior phase —
  this repair didn't have credentials or a browser any more than Phase 5 did. `/admin/login`
  redirect behavior, a real forged-cookie rejection, and the full CRUD/autosave/publish flows are
  still only verified by code review and static build success, not live HTTP or browser testing.
- **Next.js major-version upgrade** — flagged as a real backlog item (§6), not started.
- Phase 6 (caching pass, revalidation audit, cleanup, dashboard consistency, CMS showcase Project,
  scheduled-publishing resolution) is now unblocked and is the next planned milestone per
  `PROJECT_HANDOFF.md` §16 — not started in this session, since this session's explicit priority
  was the baseline repair.
