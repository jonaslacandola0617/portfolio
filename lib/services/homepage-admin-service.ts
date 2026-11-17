import "server-only";
import { prisma } from "@/lib/db";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";
import type { HomepageContent } from "@/lib/validations/homepage";

export async function saveHomepageContent(content: HomepageContent) {
  await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: { homepage: toPrismaJson(content) },
  });
  revalidateContent("homepage");
}
