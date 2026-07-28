import { z } from "zod";

/**
 * Shared by every content type's bulk-delete Server Action (added during
 * the pre-Phase-6 stabilization pass, Workstream D5). Prisma cuid()
 * ids are 25 lowercase alphanumeric characters starting with "c" — the
 * regex is deliberately loose (any non-empty reasonable-length string)
 * rather than Prisma's exact cuid format, since the real trust boundary
 * is `requireAdmin()` plus the `deleteMany`/transaction only ever
 * touching rows that exist; a slightly-too-permissive id shape just
 * means "not found," not a security issue.
 */
export const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().min(1).max(50))
    .min(1, "Select at least one item.")
    .max(100, "Select 100 or fewer items at a time."),
});

export const deleteIdSchema = z.string().trim().min(1, "A valid record id is required.").max(128);

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
