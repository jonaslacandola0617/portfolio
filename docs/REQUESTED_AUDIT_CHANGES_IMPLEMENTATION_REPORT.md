# Requested Audit Changes Implementation Report

**Date:** July 29, 2026  
**Scope:** Skill grouping, homepage live data, completed-certificate management, and the simplified admin dashboard only

## 1. Skill default and normalization

`Ungrouped` is the single administrative sentinel. `Skill.group` now defaults to it in Prisma,
blank/`Untagged` inputs normalize to it, and the same `lib/skill-groups.ts` functions are used by
validation, services, forms, grouped tables, quick changes, drag/drop, and public grouping.

Existing canonical group names are reused case-insensitively after trimming and collapsing
whitespace, preventing `web development`, `Web Development`, and spacing variants from becoming
separate groups. Production inspection found no existing case/spacing duplicates.

The migration deliberately does **not** move existing `Cybersecurity` Skills. The old default was
not stored with provenance, so genuine assignments cannot be distinguished safely from accidental
ones. Preserving them is safer than a speculative data rewrite.

## 2. Skills management UI

`components/admin/grouped-skills-manager.tsx` renders one bounded management section per existing
group plus `Ungrouped`. Rows never mix groups.

Each row has:

- an existing-group selector backed by an authenticated, Zod-validated Server Action;
- an optimistic pending state and visible success/failure result;
- HTML drag/drop onto any group section, using the same action;
- per-record duplicate-request prevention; and
- record-local rollback to the original group after a failed drop.

The selector remains the keyboard-accessible alternative to drag/drop. The create/edit Group field
uses database-backed, case-insensitive suggestions with arrow-key, Enter, and Escape handling,
while still allowing a genuinely new group.

Public `/skills` maps the sentinel to a heading-less section. It never labels ungrouped Skills or
places them under Cybersecurity.

## 3. Homepage live data and Recent Activity

`lib/db/queries/homepage.ts` performs published-record counts for exactly:

- Labs Logged
- Projects Shipped
- Journal Entries
- Certifications

The homepage retains its existing four-stat layout. The former hardcoded `siteConfig.stats` values
were removed.

The static GitHub fixture and GitHub Activity card were removed. The replacement card occupies the
same layout position and merges limited, real `updatedAt` records from published Projects, Labs,
Articles, and Certificates. It links only to internal public content and has a truthful empty
state.

Production/browser values during verification were Labs `4`, Projects `5`, Articles `4`, and
Certificates `5`.

## 4. Completed-certificate contract

Certificate management no longer accepts or displays progress status, label, or percentage.
`publishStatus` remains solely the CMS visibility state.

For production-data safety, the legacy progress columns were retained rather than dropped. The
migration converts existing rows and changes their defaults to:

- `progressStatus = COMPLETED`
- `progressLabel = Completed`
- `progressPercent = 100`

Application services also write these compatibility values explicitly. Public types, queries, and
cards do not expose them.

`dateStarted` is nullable. The form accepts a Certificate with only a Completion Date or with no
Start Date, and public rendering omits absent dates. Existing records without a Completion Date
were preserved; no date was invented.

## 5. Certificate dates

The two native date fields were replaced with a small project-native dark selector composed of
keyboard-operable month/day/year controls. It posts an unshifted `YYYY-MM-DD` value, the service
constructs it at UTC midnight, optional Start Date can be cleared, and incomplete or impossible
dates fail Zod validation.

Completion Date is presented first and is the primary public date when present.

## 6. Certificate logo and Media association

The ambiguous icon-key control is now labeled **Certificate Logo**.

`components/admin/certificate-logo-picker.tsx`:

- previews the current image;
- selects existing image Media rows;
- uploads directly through the existing authenticated Vercel Blob token route;
- registers the upload through the existing authenticated Media Server Action;
- validates image type and the existing 10 MB image limit;
- immediately selects the new Media row; and
- removes/replaces only the association.

`Certificate.logoMediaId` is an optional `Media` relation with `onDelete: SetNull`. Media deletion
also checks Certificate-logo references. Public cards use `logoMedia.url` when present and retain
the existing fallback icon only when it is absent.

The isolated mutation verifier confirmed that association, read-back, removal, and Media retention
all work. A browser upload was not performed because the available local browser had no
authenticated GitHub admin session; authentication was not bypassed.

## 7. Simplified admin dashboard

The dashboard service and page now contain only:

- Projects total
- Labs total
- Articles total
- Certificates total
- Recent Activity

Timeline and Skill cards, publishing status, needs-attention checks, quick actions, health badge,
and all secondary card metrics were removed without replacement.

The four cards reuse `StatCard`: uppercase muted labels, no separator, the existing card border,
radius, spacing, and large total. Recent Activity is limited real CMS `updatedAt` data with valid
admin edit links. It is not represented as a persistent Activity Log.

## 8. Migration behavior

Migration:

`prisma/migrations/20260728190000_requested_skill_certificate_audit/migration.sql`

It:

1. adds the `Ungrouped` Skill default;
2. converts Certificate compatibility progress values to completed-only defaults;
3. makes `dateStarted` nullable;
4. adds nullable `logoMediaId`, its index, and the `SET NULL` Media foreign key; and
5. preserves every existing Skill, Certificate, and Media record.

It was first applied and seeded idempotently in isolated Neon schema
`codex_post_phase6_audit`. The reversible verifier cleaned up all temporary rows. It was then
deployed once to production with `prisma migrate deploy`. Production was never reset or reseeded.

## 9. Database read reliability

Two strict builds reproduced Prisma `P1001` reachability loss against the Neon pooled endpoint:
one during pre-build verification and one during static generation. This established it as a
transient read failure in this environment. The existing three-attempt, idempotent-read-only
policy now recognizes P1001 alongside P1017. Retry bounds and strict fail-closed behavior are
unchanged.

## 10. Verification results

Commands and results:

```text
npm ci                                  PASS (locked install; 16 existing high advisories)
npm run db:generate                     PASS
npx tsc --noEmit                        PASS
npm run lint                            PASS (0 warnings/errors)
npm run validate:editor-content         PASS (19/19)
npm run verify:save-pipeline            PASS
npm run verify:revalidation             PASS
npm run audit:content                    PASS (14 checked, 0 invalid)
npm run verify:build-data               PASS
npm run verify:phase6-data              PASS
npm run verify:post-phase6              PASS
npm run verify:requested-audit          PASS (isolated mutation + production read-only)
npm run build                           PASS
npm run build                           PASS (second consecutive captured run)
npm run verify:site                     PASS
```

Real production-data/build results:

- Projects `5`
- Labs `4`
- Articles `4`
- Certificates `5`
- Timeline `10`
- Skills `37`
- Tags `33`
- Settings `1`
- non-null TipTap documents `14`, invalid `0`
- generated static pages `78/78`
- sitemap URLs `56`
- representative tag `networking`, matching published items `4`
- search payload, detail routes, tag route, and sitemap checks `ok`

Browser verification:

- homepage live labels/counts and real Recent Activity: pass;
- GitHub Activity and Certifications in Progress absent: pass;
- public Skill headings contain no Ungrouped/Untagged label: pass;
- public Certificate cards contain no progress UI and omit absent dates: pass;
- browser console warnings/errors on tested public pages: none;
- authenticated admin interaction: blocked at the intended GitHub login boundary because no admin
  session was available. Server contracts, TypeScript, Zod, and isolated persistence/rollback
  tests passed; no auth bypass was introduced.

## 11. Files changed

The focused implementation touches:

- Prisma schema, one additive migration, and idempotent seed mapping;
- Skill normalization, validation, services, actions, forms, grouped management UI, and public query;
- homepage query, card, and page wiring;
- Certificate validation, actions, service, form, date selector, logo picker, public query/type/card;
- Media deletion reference checks;
- dashboard types, service, page, and existing stat card reuse;
- the bounded database read policy;
- the new requested-audit verifier and package command; and
- this report plus focused `ARCHITECTURE.md` corrections.

## 12. Remaining limitations

- Existing Certificates without completion dates remain date-incomplete because inventing dates
  would corrupt production meaning.
- Full authenticated browser interaction (Skill drag/select and Certificate upload/date save)
  still requires the owner to sign in through the configured GitHub OAuth account. No security
  bypass or unprotected route was added.
- The locked dependency tree still reports 16 high-severity advisories already documented in the
  repository. A framework/dependency upgrade is outside this requested audit scope.
