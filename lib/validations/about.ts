import { z } from "zod";

const trimmed = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const aboutPageSchema = z.object({
  quote: trimmed("Opening quote", 500),
  background: trimmed("Background", 4000),
  currentFocus: trimmed("Current focus", 3000),
  focusTags: z.array(trimmed("Focus tag", 80)).min(1).max(20),
  learningPhilosophy: trimmed("Learning philosophy", 3000),
  whatsNext: trimmed("What's next", 3000),
});

export type AboutPageValues = z.infer<typeof aboutPageSchema>;

const interimAboutPageSchema = z.object({
  biography: z.string(),
  currentFocus: z.string(),
  learningPhilosophy: z.string(),
});

const legacyAboutPageSchema = z.object({
  paragraphs: z.array(z.string()).optional(),
  currentFocus: z.array(z.string()).optional(),
}).passthrough();

/**
 * Reads both historical About JSON contracts without requiring a database migration.
 * SiteSettings.aboutPage is intentionally JSON, so shape evolution happens at this
 * boundary and the next admin save rewrites the record in the current Bauhaus shape.
 */
export function normalizeAboutPage(
  value: unknown,
  fallback: AboutPageValues,
): AboutPageValues {
  const current = aboutPageSchema.safeParse(value);
  if (current.success) return current.data;

  const interim = interimAboutPageSchema.safeParse(value);
  if (interim.success) {
    return {
      ...fallback,
      background: interim.data.biography.trim() || fallback.background,
      currentFocus: interim.data.currentFocus.trim() || fallback.currentFocus,
      learningPhilosophy:
        interim.data.learningPhilosophy.trim() || fallback.learningPhilosophy,
    };
  }

  const legacy = legacyAboutPageSchema.safeParse(value);
  if (legacy.success) {
    const paragraphs = legacy.data.paragraphs ?? [];
    return {
      ...fallback,
      background: paragraphs[0]?.trim() || fallback.background,
      currentFocus: paragraphs[1]?.trim() || fallback.currentFocus,
      learningPhilosophy:
        paragraphs[2]?.trim() || fallback.learningPhilosophy,
      focusTags:
        legacy.data.currentFocus?.map((item) => item.trim()).filter(Boolean) ||
        fallback.focusTags,
    };
  }

  return fallback;
}

export function parseNonEmptyLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
