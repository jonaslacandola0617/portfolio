import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { SettingsFormValues } from "@/lib/validations/settings";
import { toPrismaJson } from "@/lib/prisma-json";

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
  revalidatePath("/", "layout");
}
