# Required Baseline Build Repair

**Reported from the owner's local Windows development environment:** July 26, 2026  
**Repository:** Phase 5 delivery  
**Priority:** Blocking — repair before Phase 6 or further feature work

The Phase 5 report recorded a successful sandbox build, but the owner later ran a real local
`npm run build` and reproduced an unresolved production-build failure. The local result is now
the authoritative baseline status.

## 1. Current build result

The application compiles its bundles, but emits Auth.js/Jose Edge Runtime warnings and then fails
during TypeScript validation.

### Edge Runtime warnings

```text
⚠ Compiled with warnings

./node_modules/jose/dist/webapi/lib/deflate.js

A Node.js API is used (CompressionStream at line: 10) which is not supported in the Edge Runtime.

Import trace:
jose
-> @auth/core
-> next-auth
-> auth.ts
-> middleware.ts
```

The same warning is emitted for `DecompressionStream`.

### Blocking TypeScript error

```text
/lib/services/article-admin-service.ts:72:7

Type error: Type 'TipTapDoc' is not assignable to type
'JsonNull | InputJsonValue'.

Type 'TipTapDoc' is not assignable to type 'InputJsonObject'.
Index signature for type 'string' is missing in type 'TipTapDoc'.

70 | scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
71 | publishedAt: fm.publishStatus === "PUBLISHED" ? new Date() : null,
72 | content: articleTemplate,
```

The Next.js build worker exits with code 1.

## 2. Required repair order

Before implementing Phase 6 or another feature:

1. Reproduce the failure using a clean dependency installation.
2. Fix all Prisma JSON persistence boundaries consistently.
3. Re-run TypeScript to reveal any additional occurrences after the first error.
4. Eliminate the Auth.js/Jose Edge Runtime warnings without weakening real authorization.
5. Run a complete production build.
6. Record the fix and exact verification in the next implementation report.

Do not merely suppress the warning or cast only the first failing line.

## 3. Prisma JSON root cause and required scope

The application uses a strict local `TipTapDoc` interface and TipTap's `JSONContent` type, while
Prisma JSON writes require `Prisma.InputJsonValue`. These values are JSON-serializable at runtime,
but TypeScript does not consider the custom interfaces structurally assignable to Prisma's
index-signature-based JSON object type.

The first reported error is `articleTemplate`, but the same boundary exists in at least:

```text
lib/services/article-admin-service.ts
  - createArticle()
  - updateArticleContent()

lib/services/project-admin-service.ts
  - createProject()
  - updateProjectContent()

lib/services/lab-admin-service.ts
  - createLab()
  - updateLabContent()

lib/services/certificate-admin-service.ts
  - createCertificate()
  - updateCertificateContent()
```

### Expected engineering approach

Create one explicit JSON persistence boundary rather than scattered unchecked casts.

A good implementation should:

- Accept an already validated TipTap document or JSON value.
- Reject or normalize values that JSON cannot store, such as `undefined`, functions, symbols,
  non-finite numbers, or unsupported class instances.
- Return a Prisma-compatible `Prisma.InputJsonValue`.
- Be reused by template creation and autosave/update writes.
- Keep the strict `TipTapDoc` type for rendering/editor code.
- Keep Zod validation before persistence.
- Avoid weakening `TipTapDoc` with a broad `[key: string]: unknown` index signature merely to make
  Prisma accept it.

A deliberate cast at one validated persistence boundary is acceptable. Repeating
`as unknown as Prisma.InputJsonValue` throughout individual services is not the preferred design.

After the helper is introduced, search every Prisma `Json`/`Json?` write in the repository so the
build does not stop at the next content type.

## 4. Auth.js/Jose Edge warning root cause and constraints

The trace reaches `auth.ts` because `middleware.ts` imports the complete Auth.js instance:

```text
middleware.ts
-> auth.ts
-> next-auth
-> @auth/core
-> jose
```

This repository is on Next.js 14, where Middleware runs in the Edge Runtime. The imported Jose
bundle contains compression APIs that Next.js 14's Edge analysis warns about.

### Required outcome

The final production build should not emit these `CompressionStream` or `DecompressionStream`
warnings.

### Security constraints

Any repair must preserve these authoritative controls:

1. The protected admin layout validates the actual Auth.js session using `requireAdmin()`.
2. Every mutation Server Action independently calls `requireAdmin()`.
3. GitHub sign-in remains restricted to `ADMIN_EMAIL`.
4. A forged or stale cookie must never grant access to admin data or mutations.

### Preferred direction for the current Next.js 14 baseline

Avoid importing the full Node/Auth.js implementation into Edge Middleware.

A minimal Edge-safe middleware may perform only a cheap early check or redirect, while the
protected Node-side admin layout remains the authoritative session validator. If middleware uses
cookie presence as an optimization, document clearly that it is not an authorization boundary;
the layout and Server Actions must still validate the signed session.

Other acceptable approaches include an officially supported Auth.js/Next.js configuration that
produces a warning-free Edge bundle, or a carefully tested framework upgrade that supports a
Node.js middleware/proxy runtime. However:

- Do not perform an uncontrolled framework-major upgrade solely to remove this warning.
- Do not remove the protected layout or Server Action checks.
- Do not use webpack warning suppression as the fix.
- Do not mark unsupported APIs as allowed when they could execute at runtime.
- Do not silently delete middleware without updating the architecture and threat model.

## 5. Verification checklist

The repair is complete only when all applicable checks pass:

```bash
rm -rf node_modules .next
npm ci
npm run db:generate
npx tsc --noEmit
npm run lint
npm run build
```

Also verify:

- No `TipTapDoc`/`JSONContent` to `Prisma.InputJsonValue` errors remain.
- No Jose `CompressionStream` or `DecompressionStream` Edge Runtime warning remains.
- `/admin/login` remains reachable.
- An unauthenticated `/admin` request cannot render protected data.
- A fake cookie cannot bypass the protected admin layout.
- Every content autosave/create path still stores valid TipTap JSON.
- The public site still builds and renders.
- The exact dependency versions used for verification are recorded.

If OAuth credentials, a database, or a browser are unavailable, type/build verification is still
mandatory. Record the remaining runtime checks as unverified rather than claiming success.

## 6. Reporting correction

The next report must state that the Phase 5 sandbox build result did not reproduce the owner's
local environment. The current project status is:

> Phase 5 feature implementation is delivered, but the local production build is not yet clean.
> Baseline build repair is required before Phase 6 can be considered started.

Do not continue quoting the old Phase 5 “full build passed” statement without this correction.
