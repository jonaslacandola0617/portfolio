import { z } from "zod";

/**
 * Shared by every content type's bulk-delete Server Action. Prisma cuid()
 * ids are deliberately validated loosely here; requireAdmin() remains the
 * authorization boundary and the data layer only mutates rows that exist.
 */
export const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().min(1).max(50))
    .min(1, "Select at least one item.")
    .max(100, "Select 100 or fewer items at a time."),
});

export const deleteIdSchema = z.string().trim().min(1, "A valid record id is required.").max(128);

export const projectShowcaseToggleSchema = z.object({
  id: deleteIdSchema,
  enabled: z.boolean(),
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
