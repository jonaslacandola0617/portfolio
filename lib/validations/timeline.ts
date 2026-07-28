import { z } from "zod";

export const timelineFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(1000),
  date: z.string().min(1, "Date is required"),
  category: z.enum(["networking", "security", "linux", "programming", "milestone"]),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  tags: z.array(z.string().min(1)).default([]),
  scheduledFor: z.string().optional().or(z.literal("")),
});

export type TimelineFormValues = z.infer<typeof timelineFormSchema>;
