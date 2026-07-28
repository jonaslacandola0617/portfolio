import "server-only";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/site-config";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";
import type { AboutPageValues } from "@/lib/validations/about";

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
