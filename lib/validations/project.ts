import { z } from "zod";
import { tiptapDocSchema } from "@/lib/validations/content";

/**
 * Validates every Project create/update Server Action payload before it
 * touches Prisma — the first concrete use of "Zod validates Server
 * Action inputs" (ARCHITECTURE.md rule #3), deferred since Phase 2/3 had
 * no forms yet.
 */
export const projectFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  summary: z.string().min(1, "Summary is required").max(500),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  progressStatus: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  tags: z.array(z.string().min(1)).default([]),
  skills: z.array(z.string().min(1)).default([]),
  technologies: z.array(z.string().min(1)).default([]),
  estimatedTime: z.string().max(100).optional().default(""),
  completionDate: z.string().min(1, "Completion date is required"),
  githubUrl: z.string().url().optional().or(z.literal("")),
  scheduledFor: z.string().optional().or(z.literal("")),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

/** Content is validated separately from the metadata form — it's saved
 *  via a different, more frequent path (autosave) than the rest of the
 *  fields (explicit form submit), so they're two schemas, not one. */
export const projectContentSchema = tiptapDocSchema;
