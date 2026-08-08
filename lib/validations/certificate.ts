import { z } from "zod";
import { httpsUrlSchema } from "@/lib/validations/url";

const optionalDateSchema = z.string().trim().refine((value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, "Choose a valid date");

export const certificateFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  issuer: z.string().min(1, "Issuer is required"),
  logoMediaId: z.string().trim().max(128).optional().or(z.literal("")),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  skills: z.array(z.string().min(1)).default([]),
  dateStarted: optionalDateSchema.optional().or(z.literal("")),
  dateCompleted: optionalDateSchema.optional().or(z.literal("")),
  credentialUrl: httpsUrlSchema.optional().or(z.literal("")),
  scheduledFor: z.string().optional().or(z.literal("")),
});

export type CertificateFormValues = z.infer<typeof certificateFormSchema>;
