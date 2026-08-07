import "server-only";

/**
 * Shared error handling for admin Server Actions — added during the
 * pre-Phase-6 stabilization pass (Workstream B3/A5). Two things every
 * mutating action needs, previously duplicated ad hoc or missing
 * entirely:
 *
 *  1. `isNextControlFlowError` — Next.js implements `redirect()` and
 *     `notFound()` by throwing a special error with a `digest` starting
 *     with `NEXT_REDIRECT`/`NEXT_NOT_FOUND`. A `try/catch` wrapped
 *     around a service call MUST rethrow these, not treat them as an
 *     ordinary failure — swallowing one silently breaks the redirect
 *     instead of showing an error. Every action below calls this first
 *     inside its `catch` block, before doing anything else.
 *  2. `classifyServiceError` — maps a caught error to a safe, specific,
 *     user-facing message instead of exposing a raw Prisma/DB error to
 *     the browser, while logging full context (operation, content type,
 *     record id, Prisma error code) server-side for real debugging.
 */

export function isNextControlFlowError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"));
}

export interface ServiceErrorContext {
  operation: string;
  contentType: string;
  recordId?: string;
}

export interface ServiceErrorResult {
  success: false;
  message: string;
  code: string;
}

/**
 * Prisma error codes referenced below (stable across Prisma versions —
 * https://www.prisma.io/docs/orm/reference/error-reference):
 *   P2002 unique constraint violation (duplicate slug/name)
 *   P2003 foreign key constraint violation
 *   P2025 record required for the operation was not found
 *   P1xxx  connection-level failures (can't reach the database)
 */
export function classifyServiceError(error: unknown, context: ServiceErrorContext): ServiceErrorResult {
  const prismaCode = typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : undefined;

  // Server-side only — never sent to the browser. The raw error is also
  // excluded because Prisma invocation excerpts can contain document data.
  console.error(`[admin:${context.contentType}:${context.operation}] failed`, {
    contentType: context.contentType,
    recordId: context.recordId,
    operation: context.operation,
    validationStage: "database",
    prismaCode,
    errorType: error instanceof Error ? error.name : typeof error,
  });

  if (prismaCode === "P2002") {
    return { success: false, message: "That slug or name is already in use.", code: "DUPLICATE" };
  }
  if (prismaCode === "P2025") {
    return { success: false, message: "This record no longer exists — it may have been deleted elsewhere.", code: "NOT_FOUND" };
  }
  if (prismaCode === "P2003") {
    return { success: false, message: "That change conflicts with related data. Try again.", code: "RELATION_CONFLICT" };
  }
  if (typeof prismaCode === "string" && prismaCode.startsWith("P1")) {
    return { success: false, message: "The database couldn't be reached. Try again in a moment.", code: "DB_UNAVAILABLE" };
  }
  return { success: false, message: "Something went wrong saving your changes. Try again.", code: "UNKNOWN" };
}
