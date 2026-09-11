import "server-only";
import { prisma } from "@/lib/db";
import type { SettingsFormValues } from "@/lib/validations/settings";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";

export async function upsertSiteSettings(fm: SettingsFormValues) {
  // `currentlyLearning` is the one non-TipTap Json field in the schema
  // (an array of { label, href }) — same structural mismatch against
  // Prisma.InputJsonValue as TipTap content, same fix: route it through
  // the one shared JSON persistence boundary rather than a local cast.
  const data = { ...fm, currentlyLearning: toPrismaJson(fm.currentlyLearning) };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: { ...data },
  });
  revalidateContent("settings");
}

export async function updateHomepageProjectIds(ids: string[]) {
  const cleanIds = ids.filter(Boolean);
  if (new Set(cleanIds).size !== cleanIds.length) {
    throw new Error("Choose two different projects.");
  }

  if (cleanIds.length) {
    const published = await prisma.project.findMany({
      where: { id: { in: cleanIds }, publishStatus: "PUBLISHED" },
      select: { id: true },
    });
    if (published.length !== cleanIds.length) {
      throw new Error("Homepage showcase projects must be published projects.");
    }
  }

  await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: { homepageProjectIds: cleanIds },
  });
  revalidateContent("settings");
}
