# Phase 0 Report — Prisma + Neon + Auth.js Foundation

Scope, per your approval: configure Prisma, connect to Postgres, stand up the Auth.js foundation,
verify the schema, generate/apply the initial migration, confirm `npm run build` and the public
site are unaffected. Nothing from Phase 1 onward was touched.

## 1–2. Files changed, and why

### New files

| File | Why |
| --- | --- |
| `prisma/schema.prisma` | Updated from the reviewed draft — see §"Schema changes" below |
| `lib/db.ts` | Prisma Client singleton (hot-reload-safe pattern, per the migration plan) |
| `auth.ts` | Auth.js v5 config — GitHub provider, JWT sessions, no adapter (see §"Auth" below) |
| `app/api/auth/[...nextauth]/route.ts` | Required route handler for Auth.js's OAuth callback flow — the minimum needed for the "foundation" to be functional/testable |
| `types/next-auth.d.ts` | TypeScript module augmentation for the `session.user.isAdmin` field used in `auth.ts` |
| `.env.example` | Documents every env var Phase 0 introduced, committed (no real secrets) |
| `prisma/manual_validation.sql` | Not a real migration — a hand-written DDL translation of the schema used to validate it locally. See §6, this exists because of a real blocker. |

### Modified files

| File | Change | Why |
| --- | --- | --- |
| `package.json` | Added `prisma` (devDependency), `@prisma/client`, `next-auth`; added `postinstall`, `db:generate`, `db:migrate`, `db:push`, `db:studio` scripts | New tooling needs declaring; the `db:*` scripts are the exact commands you'll run once real Neon credentials are in place (§6) |
| `package-lock.json` | Auto-updated by `npm install` | Standard lockfile churn, not hand-edited |

### Untouched — confirmed by rebuilding

Every file under `app/` (except the one new auth route) and every file under `components/` — zero
diffs. `npm run build` output (§5) shows all 56 pre-existing routes generated at their original
sizes.

### Schema changes since the version you reviewed

Two additions per your approval notes, both applied to `prisma/schema.prisma`:

- `publishedAt` and `scheduledFor` now also exist on `Certificate` and `TimelineEntry` (they were
  already on Project/Lab/Article). You asked for `publishedAt` uniformly for RSS/scheduling
  support — `Certificate` and `TimelineEntry` were the two content types missing it.
- Added a comment block (not a model — no schema/migration impact) sketching the future
  `Revision` model shape, mirroring the existing non-polymorphic `Download` pattern (one revision
  table per content type, not one generic polymorphic table). This is the "leave room for it"
  request — nothing to apply now, just documented intent so Phase 4+ doesn't have to guess.

## 3. Commands executed

```bash
# Dependencies
npm install prisma@7 @prisma/client@7        # then reconsidered — see §6
npm install prisma@6.19.3 @prisma/client@6.19.3
npm install next-auth@beta

# Local Postgres, standing in for Neon (see §6 for why)
apt-get install postgresql postgresql-contrib
service postgresql start
psql -c "CREATE DATABASE cyber_portfolio_dev;"

# What I could NOT run — see §6
npx prisma validate
npx prisma generate
npx prisma migrate dev --name init

# What I ran instead, against the local Postgres, to validate the schema anyway
psql -f prisma/manual_validation.sql
# + a smoke-test script covering FK, many-to-many, and cascade-delete (§4)

# Build verification
npx tsc --noEmit
npm run build
```

## 4. Migration output

**The literal `prisma migrate dev` could not run** — see §6 for the exact reason. What I have
instead is arguably more informative for a review: `prisma/manual_validation.sql`, a hand-written
DDL translation of `schema.prisma`, applied directly to a local Postgres 16 instance, with every
`CREATE TYPE`/`CREATE TABLE`/`CREATE INDEX` statement succeeding with no errors.

I then ran a smoke test across the relations that are easiest to get wrong — many-to-many joins,
foreign keys, and cascade deletes:

```
 title                       | category   | thumbnail | tags   | skills               | certificates | downloads
 Home Lab VLAN Segmentation  | Networking | thumb.png | {VLAN} | {"VLANs & Trunking"} | {CCNA}       | 1
```

Then deleted that Project and confirmed cascade behavior was exactly right — its `Download` row
and both join-table rows were removed, while the related `Certificate` (many-to-many, should
*not* cascade) correctly survived:

```
 orphaned_downloads | orphaned_tag_links | orphaned_skill_links | orphaned_cert_links | certificate_still_exists
                   0 |                   0 |                     0 |                    0 |                        1
```

This confirms the relational design itself is sound. It does **not** confirm that Prisma's own
migration engine will generate identical SQL — it's my hand-translation, reviewed carefully
against Prisma's actual conventions (quoted PascalCase tables, `_ModelATo ModelB` join table
naming), but the authoritative migration file only exists once you run `prisma migrate dev` for
real (exact command in §6).

## 5. Build verification

```
✓ Compiled successfully
✓ Generating static pages (56/56)
```

Same 56 routes, same sizes, as the pre-Phase-0 build — including all 4 project pages, 4 lab
pages, 4 journal pages, and 30 tag pages. The one addition is
`ƒ /api/auth/[...nextauth]` (0 B, server-rendered on demand, as expected for a route handler).
`npx tsc --noEmit` passed with zero errors. I did not spin up `next dev` and click through the
site by hand, but static-generation succeeding for every content page is a strong signal the
public site's data flow is byte-for-byte what it was before — nothing in `app/` or `components/`
changed.

One environment note carried over from the original build: this sandbox can't reach
`fonts.googleapis.com`, so I verify builds with the font imports temporarily stubbed out, then
restore the real `next/font/google` imports afterward (confirmed restored — `app/layout.tsx`
currently imports `Inter`, `Space_Grotesk`, `JetBrains_Mono` as before). This isn't a Phase 0
issue, it's a standing sandbox constraint noted in the original delivery.

## 6. Issues encountered

**The one real blocker: I could not run the actual Prisma CLI (`generate`/`validate`/`migrate
dev`) or connect to a real Neon database from this sandbox.**

Two independent network restrictions, not something more Prisma config can route around:

1. Prisma's CLI needs to download a platform-specific engine binary from `binaries.prisma.sh` the
   first time you run `generate`/`migrate`/`validate` in a new environment. That domain isn't in
   this sandbox's allowed list (confirmed: `403` from the egress proxy, not from Prisma's server).
2. Separately, this sandbox's network access is HTTP-domain-allowlisted, not general TCP —
   reaching an arbitrary Neon endpoint on its Postgres port isn't part of that allowlist either.
   Even with the engine binary problem solved, I wouldn't be able to reach your real database from
   here, and I don't have your Neon credentials regardless (nor should I — that's exactly the kind
   of secret that belongs in your own `.env.local`, not pasted into a chat).

**What this means practically:** the very last step of Phase 0 — pointing Prisma at your actual
Neon database and running the real migration — has to happen from a normal machine or your CI
(both have unrestricted internet access, so this is a non-issue there, not a flaw in the schema or
setup). Once you've created a Neon project and put its two connection strings into `.env.local`:

```bash
npm install          # postinstall runs `prisma generate` automatically
npm run db:migrate    # prisma migrate dev --name init, against the real Neon database
```

That's genuinely it — two commands. Everything else Phase 0 asked for (schema design, client
singleton, Auth.js config, env var documentation, relational validation, build verification) is
done and in this delivery.

**Secondary, smaller finding:** `npm install prisma@7 @prisma/client@7` (the version I initially
tried) pulled in `@prisma/dev`/`@hono/node-server`, which `npm audit` flags at moderate severity.
Downgrading to `6.19.3` — still a current, fully-supported major version, nothing in the schema
needs anything v7-specific — removed both advisories cleanly. Confirmed via `npm audit`: 9
vulnerabilities before, 6 after, and the 6 remaining are pre-existing (`next`, `next-mdx-remote`,
`eslint-config-next`, `postcss` — see §7, not introduced by this phase).

## 7. Recommended improvements before Phase 1

1. **`next-auth` is on `5.0.0-beta.31`, not a stable release.** I checked the registry rather than
   assume — as of today, Auth.js v5 is still beta-tagged (`latest` on npm is still v4.24.14). I
   used v5 anyway because it's what makes `auth()` usable natively in Server Components and
   middleware, which Phase 1's `/admin` protection needs — v4's API doesn't fit the App Router
   nearly as cleanly. This is genuinely the standard choice for new App Router projects right now,
   but it's a beta dependency in a project you called production-quality, so flagging it
   explicitly rather than letting it pass silently. If you'd rather pin v4 or revisit this, now's
   the cheaper time to change it than after Phase 1's middleware is built on top of it.
2. **Pre-existing `npm audit` findings, unrelated to Phase 0, worth a conscious decision:**
   `next` (14.2.35) has two high-severity advisories fixed in the `16.x` line; `next-mdx-remote`
   has a high-severity RSC advisory (low real-world risk here since our MDX content is first-party,
   not user-submitted, and it's already scheduled for removal once the CMS migration completes).
   I didn't touch either — a Next.js major-version bump is a meaningfully sized, separate piece of
   work with its own testing, and out of scope for "configure Prisma and Auth.js." Worth scheduling
   deliberately, possibly before Phase 1 rather than after, since middleware/auth code is easier to
   write once against a settled Next.js version than to port across a major bump later.
3. **You'll need a GitHub OAuth App before Phase 1's login flow is testable** — create one at
   `github.com/settings/developers` (guidance already in `.env.example`). Takes about a minute;
   flagging now so it's not a surprise blocker mid-Phase-1.
4. **Decide where `ADMIN_EMAIL` verification should also block at the middleware layer, not just
   `signIn`.** Right now the `signIn` callback is the only enforcement point — correct for Phase 0
   since there's nothing to protect yet, but Phase 1's `middleware.ts` should double-check
   `auth().user.isAdmin` on every `/admin/*` request too, not rely on the callback alone. Noting it
   now so it's not forgotten when middleware gets written.

Local Postgres (this sandbox only, not part of the delivery) is left running in case you'd like
me to continue validating against it in Phase 1 before you've stood up the real Neon instance —
let me know either way.

Waiting for your go-ahead before starting Phase 1.
