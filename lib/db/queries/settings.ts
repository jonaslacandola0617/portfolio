import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import { siteConfig } from "@/lib/site-config";

export interface SiteSettingsData {
  name: string;
  role: string;
  tagline: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  resumeUrl: string;
  currentlyLearning: { label: string; href: string }[];
}

function fallback(): SiteSettingsData {
  return {
    name: siteConfig.name,
    role: siteConfig.role,
    tagline: siteConfig.tagline,
    email: siteConfig.email,
    githubUrl: siteConfig.social.github,
    linkedinUrl: siteConfig.social.linkedin,
    resumeUrl: siteConfig.resumeUrl,
    currentlyLearning: [...siteConfig.currentlyLearning],
  };
}

export const getSiteSettings = cache(async (): Promise<SiteSettingsData> =>
  readWithPolicy("settings.getSiteSettings", fallback, async () => {
    const row = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!row) return fallback();
    return {
      name: row.name,
      role: row.role,
      tagline: row.tagline,
      email: row.email,
      githubUrl: row.githubUrl,
      linkedinUrl: row.linkedinUrl,
      resumeUrl: row.resumeUrl,
      currentlyLearning: row.currentlyLearning as { label: string; href: string }[],
    };
  })
);
