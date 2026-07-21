import { z } from "zod";
import { tiptapDocSchema } from "@/lib/validations/content";

export const labFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  purpose: z.string().min(1, "Purpose is required").max(500),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  progressStatus: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"]),
  tags: z.array(z.string().min(1)).default([]),
  labDate: z.string().min(1, "Lab date is required"),
  scheduledFor: z.string().optional().or(z.literal("")),
});

export type LabFormValues = z.infer<typeof labFormSchema>;
export const labContentSchema = tiptapDocSchema;
