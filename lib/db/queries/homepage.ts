import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import { defaultHomepage } from "@/lib/homepage-defaults";
import { homepageSchema, SECTION_KEYS, type HomepageContent } from "@/lib/validations/homepage";

/**
 * Validates saved homepage JSON one part at a time, so a single invalid or
 * missing part falls back to its default instead of discarding the rest.
 */
export function normalizeHomepage(value: unknown): HomepageContent {
  if (!value || typeof value !== "object") return defaultHomepage;
  const saved = value as Record<string, unknown>;
  const shape = homepageSchema.shape;
  const result = { ...defaultHomepage } as Record<string, unknown>;

  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    if (key === "sections") continue;
    const parsed = shape[key].safeParse(saved[key]);
    if (parsed.success) result[key] = parsed.data;
  }

  const savedSections = (saved.sections && typeof saved.sections === "object" ? saved.sections : {}) as Record<string, unknown>;
  const sectionShape = shape.sections.shape;
  result.sections = Object.fromEntries(
    SECTION_KEYS.map((key) => {
      const parsed = sectionShape[key].safeParse(savedSections[key]);
      return [key, parsed.success ? parsed.data : defaultHomepage.sections[key]];
    }),
  );

  return result as HomepageContent;
}

export const getHomepageContent = cache(async (): Promise<HomepageContent> =>
  readWithPolicy("homepage.getHomepageContent", () => defaultHomepage, async () => {
    const row = await prisma.siteSettings.findUnique({ where: { id: "singleton" }, select: { homepage: true } });
    return normalizeHomepage(row?.homepage);
  }),
);
