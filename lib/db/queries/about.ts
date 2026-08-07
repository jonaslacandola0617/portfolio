import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import { normalizeAboutPage, type AboutPageValues } from "@/lib/validations/about";
import { defaultAboutPage } from "@/lib/about-defaults";

export const getAboutPage = cache(async (): Promise<AboutPageValues> =>
  readWithPolicy("about.getAboutPage", () => defaultAboutPage, async () => {
    const row = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { aboutPage: true },
    });
    if (!row?.aboutPage) return defaultAboutPage;
    return normalizeAboutPage(row.aboutPage, defaultAboutPage);
  })
);
