import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";

/**
 * Homepage showcase state belongs to Project rows, not global site settings.
 * Only published projects are returned so a draft/archive can never leak into
 * the public homepage even if stale database state exists during a rollout.
 */
export const getHomepageShowcaseProjectIds = cache(async (): Promise<string[]> =>
  readWithPolicy("homepage.getShowcaseProjectIds", [], async () => {
    const projects = await prisma.project.findMany({
      where: {
        publishStatus: "PUBLISHED",
        showcaseOrder: { not: null },
      },
      select: { id: true },
      orderBy: { showcaseOrder: "asc" },
      take: 2,
    });

    return projects.map((project) => project.id);
  })
);
