import { z } from "zod";

const trimmed = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const aboutPageSchema = z.object({
  eyebrow: trimmed("Eyebrow", 40),
  title: trimmed("Title", 120),
  description: trimmed("Description", 240),
  paragraphs: z.array(trimmed("Paragraph", 2000)).min(1).max(8),
  pillars: z.array(z.object({
    icon: z.enum(["compass", "wrench", "refresh"]),
    title: trimmed("Pillar title", 80),
    body: trimmed("Pillar description", 500),
  })).length(3),
  focusLabel: trimmed("Focus label", 80),
  currentFocus: z.array(trimmed("Focus item", 80)).max(20),
});

export type AboutPageValues = z.infer<typeof aboutPageSchema>;

export function parseNonEmptyLines(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}
