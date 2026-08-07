# Phase 6 Report — Cleanup, Revalidation, and CMS Showcase

Date: July 28, 2026

## Outcome

Phase 6 is complete without changing the public design, route structure, authentication model,
editor, or CMS architecture. The pass added request-scoped read memoization, centralized mutation
revalidation, a non-destructive CMS showcase seed, an explicit manual-publishing policy, current
dependency/security findings, and real-data verification.

## Request-level caching

Public collection, detail, settings, timeline, skill, certificate, tag, slug, and count reads use
React `cache()` only. This deduplicates identical reads during one server render or static
generation request. No persistent cache or time-based cache was introduced, so no new stale-data
window exists and the strict database failure policy remains intact.

## Revalidation architecture

`lib/revalidation-targets.ts` is a pure typed matrix. The server-only
`lib/services/content-revalidation.ts` executes it. Project, Lab, and Article mutations invalidate:

- admin dashboard and management list;
- public collection;
- old and new detail slugs;
- all tag detail pages;
- the root layout, which owns public search data;
- sitemap routing.

Certificate, Timeline, Skill, Settings, and Media services declare their smaller affected
surfaces in the same matrix. Actions no longer duplicate service revalidation.

`npm run verify:revalidation` asserts representative targets, including both sides of a slug
rename.

## Live invalidation finding

An authenticated production-mode mutation renamed the showcase title, slug, and tag. The new
detail, collection, tag page, and root search payload refreshed, and the old detail stopped
rendering its former record. The metadata sitemap remained stale. Converting it to a force-static
route handler still retained stale XML under Next.js 14.

The final sitemap is therefore an explicit `app/sitemap.xml/route.ts` route with
`dynamic = "force-dynamic"` and `Cache-Control: no-store`. It performs only bounded slug/tag reads.
The record was restored through the admin form, and the final verification confirmed the original
URL was present while the temporary slug and tag were absent.

## Scheduled publishing resolution

Automatic scheduled publishing was not operational, so Phase 6 stopped presenting it:

- Project, Lab, Article, Certificate, and Timeline form validation accepts Draft, Published, or
  Archived only;
- the corresponding admin controls no longer show Scheduled or a scheduled timestamp;
- migration `20260728090000_phase_6_resolve_scheduled_status` converts legacy Scheduled rows to
  Draft and clears their scheduled timestamps;
- the dashboard no longer implies automatic publication.

The Prisma enum and nullable timestamp columns remain for migration-history compatibility. They
are not a supported product workflow.

## CMS showcase

`prisma/seed/cms-showcase.ts` creates the truthful published
`Cybersecurity Portfolio CMS` Project with validated TipTap JSON, technologies, category, and
tags. It first checks the stable slug and returns without writing if the record already exists.
This makes the seed repeatable without overwriting owner edits.

The seed is available independently as `npm run db:seed:showcase` and is also part of the full
seed. It was run twice: the first run created the record and the second reported it already
present.

## Cleanup and dependency review

`framer-motion` and `@types/mdx` had no imports and were removed. `gray-matter`, Remark, Unified,
and MDX parser packages remain because the recovery seed actively uses them.

The current audit is not clean. The production tree reports two high-severity roots involving
Next.js 14 and nested PostCSS; the full tree additionally reports ESLint-era transitive findings.
The automated force fix proposes major upgrades to Next.js 16 and ESLint 10. That change was not
applied because it is a framework/toolchain-major migration outside this bounded phase and requires
its own compatibility pass. Deployment should not treat this repository as security-current until
that upgrade is completed.

## Data verification

The Phase 6 verifier checks that:

- the showcase exists at its stable slug and is Published;
- its TipTap document passes the shared validator;
- it retains the expected technology metadata;
- no legacy Scheduled records remain across the five publishable models.

The database-backed content audit checked 13 non-null long-form documents with zero invalid
documents. Strict build verification observed 5 Projects, 4 Labs, 4 Articles, 4 Certificates,
10 Timeline entries, 37 Skills, 33 Tags, and one Settings record after the temporary live-test tag
was removed.

## Verification commands

The completed verification sequence is:

```text
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run db:seed:showcase
npm run verify:phase6-data
npm run validate:editor-content
npm run verify:save-pipeline
npm run audit:content
npm run verify:build-data
npm run verify:revalidation
.\node_modules\.bin\tsc.cmd --noEmit
npm run lint
npm run build
npm run build
npm run verify:site
```

Both production builds use `STRICT_BUILD_DATA=1`; a database failure remains fatal instead of
becoming an empty static site. The running-site verifier checks expected route bodies and compares
collection, tag, search, and sitemap output with real database counts.

The machine's global `npx` shim referenced a missing npm module during the final pass, so the
repository-local TypeScript executable was used directly. It completed with no errors.

## Files and behavior changed

- request-only count memoization in the Project, Lab, Article, and Certificate query modules;
- typed revalidation target and execution helpers;
- all content/admin services moved to the shared revalidation path;
- dynamic no-store sitemap route;
- Scheduled options removed from five validators/forms and dashboard copy;
- one deployed data migration for legacy Scheduled rows;
- idempotent showcase seed and Phase 6 data/revalidation verification commands;
- unused dependency removal and setup/architecture documentation updates.

## Remaining limitations

- Scheduled publishing is intentionally unavailable until a secure scheduler is separately
  designed and approved.
- The current Next.js/ESLint security upgrade is deferred and should be treated as deployment
  hardening work, not ignored.
- Persistent Activity Log, revision history, multi-user roles, and selectable template cards remain
  outside Phase 6.
- The template-card redesign explicitly remains deferred.
