import { z } from "zod";

export const settingsFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  tagline: z.string().min(1, "Tagline is required"),
  email: z.string().email("Must be a valid email"),
  githubUrl: z.string().url("Must be a valid URL"),
  linkedinUrl: z.string().url("Must be a valid URL"),
  resumeUrl: z.string().min(1, "Resume path is required"),
  currentlyLearning: z
    .array(z.object({ label: z.string().min(1), href: z.string().min(1) }))
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
