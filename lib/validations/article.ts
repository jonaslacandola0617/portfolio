import { z } from "zod";
import { tiptapDocSchema } from "@/lib/validations/content";

export const articleFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  summary: z.string().min(1, "Summary is required").max(500),
  category: z.string().min(1, "Category is required"),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  tags: z.array(z.string().min(1)).default([]),
  date: z.string().min(1, "Date is required"),
  scheduledFor: z.string().optional().or(z.literal("")),
  templateId: z.enum(["article-blank", "article-learning", "article-tutorial", "article-concept", "article-retrospective", "article-course"]).default("article-blank"),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;
export const articleContentSchema = tiptapDocSchema;
