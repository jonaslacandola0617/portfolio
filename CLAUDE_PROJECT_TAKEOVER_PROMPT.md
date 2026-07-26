# Claude Project Takeover Prompt

Take over the attached **Cyber Portfolio CMS** repository as its continuing engineering owner.

This is an existing project, not a greenfield build. It has already progressed through Phase 5 of a migration from an MDX/static-data portfolio into a database-backed CMS.

Begin by reading, in this order:

1. `PROJECT_HANDOFF.md`
2. `ARCHITECTURE.md`
3. `docs/REQUIRED_BASELINE_BUILD_REPAIR.md`
4. The latest phase report under `docs/`
5. `docs/CMS_MIGRATION_PLAN.md`
6. The source files relevant to the current task

The handoff is permanent project context, while the migration plan explains the original CMS conversion strategy. The current source and latest reports take precedence when older planning text is stale.

From now on:

- Continue the existing repository rather than proposing a replacement app.
- Preserve the public portfolio’s current design and routes unless I explicitly request a redesign.
- Preserve the approved stack: Next.js, TypeScript, Tailwind, Prisma, Neon PostgreSQL, GitHub OAuth through Auth.js, TipTap, and Vercel Blob.
- Follow the established query, service, validation, authenticated Server Action, seed, and rendering architecture.
- Keep all seed and migration operations idempotent.
- Do not weaken admin authentication or expose secrets.
- Do not claim unfinished features or unperformed tests are complete.
- Do not stop at planning when I ask for implementation.
- Update `ARCHITECTURE.md` whenever architecture changes.
- Write a report under `docs/` for each substantial phase or feature batch.
- Fix the reported Phase 5 build blocker across every Prisma TipTap JSON write, not only the first failing article line.
- Remove the Auth.js/Jose Edge Runtime warnings without weakening the protected layout or Server Action authorization.
- Run TypeScript, lint, build, security, and end-to-end checks as far as the environment allows.
- Clearly distinguish verified behavior from credential- or browser-dependent behavior that could not be tested.
- Return the complete updated repository as a downloadable ZIP after making changes.

Phase 5 features are delivered, but the owner's local `npm run build` exposed an unresolved Prisma JSON type failure and Auth.js/Jose Edge Runtime warnings. Your first engineering task is to complete `docs/REQUIRED_BASELINE_BUILD_REPAIR.md` and obtain a clean build. Phase 6 is the next documented milestone after that repair, but you are taking ownership of the entire project beyond Phase 6 as well. Follow my latest request for immediate priority while using the handoff to preserve long-term continuity.

Do not ask me to repeat decisions already documented. Inspect the code, make conservative decisions consistent with the existing architecture, keep progress messages brief, and spend the session on real engineering.
