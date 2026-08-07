import type { Prisma } from "@prisma/client";

/**
 * The single Prisma JSON persistence boundary for this project.
 *
 * `TipTapDoc` (types/tiptap.ts, our strict local contract) and TipTap's
 * own `JSONContent` are both JSON-serializable at runtime, but neither is
 * structurally assignable to `Prisma.InputJsonValue` — Prisma's JSON
 * input types are built on an index-signature object
 * (`{ [Key in string]?: InputJsonValue }`), and a normal TypeScript
 * `interface`/discriminated-union type doesn't declare that signature
 * even when every value it can hold is plain JSON. That's the exact
 * shape of the TS error this function exists to fix once, in one place,
 * rather than as a scattered `as unknown as Prisma.InputJsonValue` at
 * every `content:`/JSON-field write across the admin services and the
 * seed script (see docs/REQUIRED_BASELINE_BUILD_REPAIR.md §3).
 *
 * Every Prisma `Json`/`Json?` write in this repository — TipTap `content`
 * columns (Project/Lab/Article/Certificate) and `SiteSettings
 * .currentlyLearning` — should go through this function rather than
 * writing its own cast.
 *
 * Deliberately NOT a plain `as unknown as Prisma.InputJsonValue` cast:
 * the `JSON.parse(JSON.stringify(...))` round-trip is real runtime
 * normalization, not just a type-level assertion —
 *   - strips keys whose value is `undefined`, and drops functions/symbols
 *     entirely (JSON.stringify already does this for object properties),
 *   - throws a real `TypeError` on a circular reference or a `BigInt`,
 *     surfacing a bad value at the write site instead of corrupting a
 *     row or failing silently later,
 *   - collapses `NaN`/`Infinity`/`-Infinity` to `null`, which is what
 *     Postgres's `json`/`jsonb` types would have to do anyway (they have
 *     no native representation for a non-finite number).
 * That matches "reject or normalize values JSON cannot store" from the
 * repair doc's expected engineering approach without weakening
 * `TipTapDoc` itself with a broad index signature — `TipTapDoc` stays the
 * strict type every renderer/editor/validator uses; only this one
 * function's return type is Prisma's.
 *
 * Callers are expected to pass an already Zod-validated value (see
 * lib/validations/content.ts and lib/validations/settings.ts) — this
 * function normalizes for JSON-storage safety, it does not replace shape
 * validation.
 */
export function toPrismaJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
