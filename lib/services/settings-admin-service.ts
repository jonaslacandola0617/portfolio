import "server-only";
import { prisma } from "@/lib/db";
import type { SettingsFormValues } from "@/lib/validations/settings";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";

export async function isResumeMediaUrl(url: string): Promise<boolean> {
  const media = await prisma.media.findFirst({
    where: { url, type: "PDF" },
    select: { id: true },
  });
  return Boolean(media);
}

export async function upsertSiteSettings(fm: SettingsFormValues) {
  // `currentlyLearning` is the one non-TipTap Json field in the schema
  // (an array of { label, href }) — same structural mismatch against
  // Prisma.InputJsonValue as TipTap content, same fix: route it through
  // the one shared JSON persistence boundary rather than a local cast.
  // "Currently learning" is no longer edited in Settings; keep what's stored unless sent.
  const { currentlyLearning, ...rest } = fm;
  const learning = currentlyLearning ? { currentlyLearning: toPrismaJson(currentlyLearning) } : {};

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...rest, currentlyLearning: toPrismaJson(currentlyLearning ?? []) },
    update: { ...rest, ...learning },
  });
  revalidateContent("settings");
}
