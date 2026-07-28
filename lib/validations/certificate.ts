import { z } from "zod";

export const certificateFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  issuer: z.string().min(1, "Issuer is required"),
  logo: z.enum(["google", "cisco", "linux", "python"]),
  progressStatus: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  progressLabel: z.string().min(1, "Progress label is required"),
  progressPercent: z.coerce.number().min(0).max(100),
  skills: z.array(z.string().min(1)).default([]),
  dateStarted: z.string().min(1, "Start date is required"),
  dateCompleted: z.string().optional().or(z.literal("")),
  credentialUrl: z.string().url().optional().or(z.literal("")),
  scheduledFor: z.string().optional().or(z.literal("")),
});

export type CertificateFormValues = z.infer<typeof certificateFormSchema>;
