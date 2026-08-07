# content/

As of Phase 3, nothing in the running application reads these `.mdx` files anymore — every page
that used to read `content/*.mdx` now queries Postgres via `lib/db/queries/*` (see
`../ARCHITECTURE.md`).

These files still exist because `prisma/seed/index.ts` reads them as the **one-time migration
source** — the script that populated the database in the first place, and the reference to
re-run against if the database is ever reset. Don't delete this folder; do add new content
through the CMS (`/admin`, once Phase 4 ships) instead of adding new `.mdx` files here, since
nothing will pick them up automatically anymore.
