import "server-only";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/site-config";
import { defaultAboutPage } from "@/lib/about-defaults";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";
import { normalizeAboutPage, type AboutPageValues } from "@/lib/validations/about";

export async function upsertAboutPage(values: AboutPageValues) {
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      name: siteConfig.name,
      role: siteConfig.role,
      tagline: siteConfig.tagline,
      email: siteConfig.email,
      githubUrl: siteConfig.social.github,
      linkedinUrl: siteConfig.social.linkedin,
      resumeUrl: siteConfig.resumeUrl,
      currentlyLearning: toPrismaJson([...siteConfig.currentlyLearning]),
      aboutPage: toPrismaJson(values),
    },
    update: { aboutPage: toPrismaJson(values) },
  });
  revalidateContent("settings");
}

export async function replaceAboutProfileImage(profileImageUrl: string | null) {
  const row = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
    select: { aboutPage: true },
  });
  const current = normalizeAboutPage(row?.aboutPage, defaultAboutPage);
  const previousUrl = current.profileImageUrl;

  try {
    await upsertAboutPage({ ...current, profileImageUrl });
  } catch (error) {
    if (profileImageUrl && profileImageUrl !== previousUrl) {
      await del(profileImageUrl).catch(() => undefined);
    }
    throw error;
  }

  if (previousUrl && previousUrl !== profileImageUrl) {
    await del(previousUrl).catch((error) => {
      console.error("[about-profile] old Blob cleanup failed", {
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
    });
  }
}
