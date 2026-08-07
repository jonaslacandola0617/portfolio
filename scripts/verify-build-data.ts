import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { auditDatabaseContent, printContentAudit } from "../lib/content-audit";
import { readWithPolicy } from "../lib/db/read-policy";

process.env.STRICT_BUILD_DATA = "1";
const prisma = new PrismaClient();

async function main() {
  const audit = await readWithPolicy("verify.contentAudit", null, () => auditDatabaseContent(prisma));
  if (!audit) throw new Error("Content audit returned no result");
  printContentAudit(audit);
  if (audit.invalid.length > 0) throw new Error(`${audit.invalid.length} invalid TipTap document(s)`);

  const counts = await readWithPolicy("verify.publicCounts", null, () =>
    Promise.all([
      prisma.project.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.lab.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.article.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.certificate.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.skill.count(),
      prisma.tag.count({
        where: {
          OR: [
            { projects: { some: { publishStatus: "PUBLISHED" } } },
            { labs: { some: { publishStatus: "PUBLISHED" } } },
            { articles: { some: { publishStatus: "PUBLISHED" } } },
          ],
        },
      }),
      prisma.siteSettings.count({ where: { id: "singleton" } }),
    ])
  );
  if (!counts) throw new Error("Public count query returned no result");
  const [projects, labs, articles, certificates, skills, tags, settings] = counts;

  if (settings !== 1) throw new Error(`Expected one SiteSettings singleton row; found ${settings}`);
  const sampleTag = await readWithPolicy("verify.tagLookup", null, () =>
    prisma.tag.findFirst({
      where: {
        OR: [
          { projects: { some: { publishStatus: "PUBLISHED" } } },
          { labs: { some: { publishStatus: "PUBLISHED" } } },
          { articles: { some: { publishStatus: "PUBLISHED" } } },
        ],
      },
      select: {
        slug: true,
        _count: {
          select: {
            projects: { where: { publishStatus: "PUBLISHED" } },
            labs: { where: { publishStatus: "PUBLISHED" } },
            articles: { where: { publishStatus: "PUBLISHED" } },
          },
        },
      },
    })
  );
  if (tags > 0 && !sampleTag) throw new Error("Published tags exist but a direct tag lookup returned no row");
  const sampleTagCount = sampleTag
    ? sampleTag._count.projects + sampleTag._count.labs + sampleTag._count.articles
    : 0;
  if (sampleTag && sampleTagCount === 0) throw new Error(`Tag ${sampleTag.slug} has no published content`);

  console.log(
    `[build-data] projects=${projects} labs=${labs} articles=${articles} certificates=${certificates} skills=${skills} tags=${tags} settings=${settings}`
  );
  console.log(
    `[build-data] tagLookup=${sampleTag ? `${sampleTag.slug}:${sampleTagCount}` : "none"} status=ok`
  );
}

main()
  .catch((error) => {
    console.error(`[build-data] verification failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
