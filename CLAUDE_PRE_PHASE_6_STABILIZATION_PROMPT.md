# Claude Continuation Prompt — Pre–Phase 6 Stabilization

Continue ownership of the attached Cyber Portfolio CMS repository.

The baseline build repair was completed successfully, but real local use exposed runtime
reliability and UX problems that must be fixed before Phase 6.

Read in this order:

1. `PROJECT_HANDOFF.md`
2. `ARCHITECTURE.md`
3. `docs/BASELINE_BUILD_REPAIR_REPORT.md`
4. `docs/PRE_PHASE_6_STABILIZATION_BRIEF.md`
5. The relevant current source

Then implement the stabilization brief directly in the existing repository.

The required outcome is:

- Reproduce and fix the Project/Lab/Article/Certificate editor autosave failure.
- Align the configured TipTap editor, strict types, Zod validator, and public renderer for every
  enabled toolbar node.
- Replace opaque autosave failures with truthful status, useful error feedback, and Retry.
- Prevent overlapping autosaves from racing newer content.
- Add pending/loading state inside every Create and Save changes button.
- Add visible form-level success and failure messages.
- Remove the invalid nested Delete forms from all six edit forms.
- Make individual deletion reliable on edit pages.
- Add individual row Delete and checkbox-based bulk Delete to every management page.
- Keep all new mutations authenticated, validated, atomic where practical, and correctly
  revalidated.
- Add skeleton route loading states so slow navigation no longer looks frozen.
- Add an admin route error boundary with Try again.
- Preserve the current public/admin design, routes, stack, and security model.
- Do not begin the Phase 6 caching/dashboard/showcase scope yet.

Do not assume the save failure is only Prisma or only Zod. Reproduce it, capture the actual editor
JSON and action failure, and fix the complete root cause.

The source already reveals important contract drift: toolbar-supported blockquotes and horizontal
rules are missing from the validator/renderer; table and callout shapes also require alignment.
It also contains nested forms around Delete controls and no `loading.tsx` or `useFormStatus`
implementation. Use these findings as starting points, then audit the entire flow.

Run clean install, Prisma generation, TypeScript, lint, editor-contract validation, production
build, and real browser/database workflows as far as the environment permits.

Create `docs/PRE_PHASE_6_STABILIZATION_REPORT.md`, update `ARCHITECTURE.md`, and return the complete
updated repository ZIP. Keep progress commentary brief and spend the session on implementation,
verification, and packaging.
