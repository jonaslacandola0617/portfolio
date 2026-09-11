import "server-only";
import { prisma } from "@/lib/db";
import type { SettingsFormValues } from "@/lib/validations/settings";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";

export async function upsertSiteSettings(fm: SettingsFormValues) {
  // `currentlyLearning` is the one non-TipTap Json field in the schema
  // (an array of { label, href }) — route it through the shared JSON
  // persistence boundary rather than keeping a local unsafe cast.
  const data = { ...fm, currentlyLearning: toPrismaJson(fm.currentlyLearning) };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: { ...data },
  });
  revalidateContent("settings");
}
