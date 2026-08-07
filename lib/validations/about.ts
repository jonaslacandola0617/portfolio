import { z } from "zod";

const trimmed = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

const currentAboutPageSchema = z.object({
  biography: trimmed("Biography", 4000),
  currentFocus: trimmed("Current focus", 3000),
  learningPhilosophy: trimmed("Learning philosophy", 3000),
});

function normalizeLegacyAboutPage(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  const record = value as Record<string, unknown>;
  if (
    typeof record.biography === "string" ||
    typeof record.currentFocus === "string" ||
    typeof record.learningPhilosophy === "string"
  ) {
    return value;
  }

  const paragraphs = Array.isArray(record.paragraphs)
    ? record.paragraphs.filter((paragraph): paragraph is string => typeof paragraph === "string")
    : [];

  // Compatibility with the pre-Bauhaus About JSON contract. SiteSettings.aboutPage
  // is a JSON column, so no database migration is required: old records are adapted
  // at the application boundary and are rewritten in the new shape on the next save.
  if (paragraphs.length || "pillars" in record || "focusLabel" in record) {
    return {
      biography:
        paragraphs[0] ??
        "I'm building toward a career in cybersecurity and network administration, coming at it from the hands-on side first.",
      currentFocus:
        paragraphs[1] ??
        "Working through the CCNA curriculum and the Google Cybersecurity Professional Certificate in parallel.",
      learningPhilosophy:
        paragraphs[2] ??
        "I don't consider something learned until I've done it hands-on and written it down.",
    };
  }

  return value;
}

export const aboutPageSchema = z.preprocess(
  normalizeLegacyAboutPage,
  currentAboutPageSchema,
);

export type AboutPageValues = z.infer<typeof currentAboutPageSchema>;
