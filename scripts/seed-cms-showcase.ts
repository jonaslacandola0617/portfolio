import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { CMS_SHOWCASE_SLUG, seedCmsShowcaseProject } from "@/prisma/seed/cms-showcase";

const prisma = new PrismaClient();

seedCmsShowcaseProject(prisma)
  .then((result) => {
    console.log(`[cms-showcase] slug=${CMS_SHOWCASE_SLUG} id=${result.id} ${result.created ? "created" : "already-present"}`);
  })
  .catch((error) => {
    console.error(`[cms-showcase] failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
