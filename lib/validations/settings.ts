import { z } from "zod";
import {
  httpsUrlSchema,
  publicDocumentUrlSchema,
  safeHrefSchema,
} from "@/lib/validations/url";

export const settingsFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  role: z.string().trim().min(1, "Role is required").max(160),
  tagline: z.string().trim().min(1, "Tagline is required").max(500),
  email: z.string().trim().email("Must be a valid email").max(254),
  githubUrl: httpsUrlSchema,
  linkedinUrl: httpsUrlSchema,
  resumeUrl: publicDocumentUrlSchema,
  currentlyLearning: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(160),
        href: safeHrefSchema,
      }),
    )
    .max(50)
    .default([]),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function parseLearningLines(raw: string): { label: string; href: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((s) => s.trim());
      return { label: label ?? "", href: href ?? "/" };
    });
}
