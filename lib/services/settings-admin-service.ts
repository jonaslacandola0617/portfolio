import "server-only";
import { prisma } from "@/lib/db";
import type { SettingsFormValues } from "@/lib/validations/settings";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";

export async function upsertSiteSettings(fm: SettingsFormValues) {
  const data = { ...fm, currentlyLearning: toPrismaJson(fm.currentlyLearning) };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: { ...data },
  });
  revalidateContent("settings");
}

export async function toggleHomepageProjectId(projectId: string, enabled: boolean) {
  const [settings, project] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { homepageProjectIds: true },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, publishStatus: true },
    }),
  ]);

  if (!settings) throw new Error("Site settings are not available.");
  if (!project) throw new Error("That project no longer exists.");

  const current = settings.homepageProjectIds.filter(Boolean);
  const alreadyEnabled = current.includes(projectId);

  if (enabled) {
    if (alreadyEnabled) return current;
    if (project.publishStatus !== "PUBLISHED") {
      throw new Error("Publish this project before adding it to the homepage showcase.");
    }
    if (current.length >= 2) {
      throw new Error("Only two projects can be showcased at once. Toggle off one of the current showcase projects first.");
    }

    const next = [...current, projectId];
    await prisma.siteSettings.update({
      where: { id: "singleton" },
      data: { homepageProjectIds: next },
    });
    revalidateContent("settings");
    return next;
  }

  if (!alreadyEnabled) return current;

  const next = current.filter((id) => id !== projectId);
  await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: { homepageProjectIds: next },
  });
  revalidateContent("settings");
  return next;
}
