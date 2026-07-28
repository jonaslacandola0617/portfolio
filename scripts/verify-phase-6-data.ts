import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { CMS_SHOWCASE_SLUG } from "@/prisma/seed/cms-showcase";
import { validateTipTapDoc } from "@/lib/validations/content";

const prisma = new PrismaClient();

async function main() {
  const [showcase, scheduledCounts] = await Promise.all([
    prisma.project.findUnique({
      where: { slug: CMS_SHOWCASE_SLUG },
      select: { id: true, title: true, publishStatus: true, content: true, technologies: true },
    }),
    Promise.all([
      prisma.project.count({ where: { publishStatus: "SCHEDULED" } }),
      prisma.lab.count({ where: { publishStatus: "SCHEDULED" } }),
      prisma.article.count({ where: { publishStatus: "SCHEDULED" } }),
      prisma.certificate.count({ where: { publishStatus: "SCHEDULED" } }),
      prisma.timelineEntry.count({ where: { publishStatus: "SCHEDULED" } }),
    ]),
  ]);

  if (!showcase) throw new Error("The CMS showcase project is missing.");
  if (showcase.publishStatus !== "PUBLISHED") throw new Error("The CMS showcase project is not published.");
  const validation = validateTipTapDoc(showcase.content);
  if (!validation.success) throw new Error("The CMS showcase document is invalid.");
  const scheduled = scheduledCounts.reduce((sum, count) => sum + count, 0);
  if (scheduled !== 0) throw new Error(`${scheduled} legacy Scheduled records remain.`);

  console.log(
    `[phase-6-data] showcase=${showcase.id} status=${showcase.publishStatus} technologies=${showcase.technologies.length} scheduled=${scheduled}`
  );
  console.log("[phase-6-data] status=ok");
}

main()
  .catch((error) => {
    console.error(`[phase-6-data] failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
