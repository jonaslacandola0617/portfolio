import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = (process.env.SITE_VERIFY_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function get(pathname: string): Promise<string> {
  const response = await fetch(`${baseUrl}${pathname}`);
  assert(response.ok, `${pathname} returned HTTP ${response.status}`);
  const body = (await response.text())
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');
  assert(!body.includes("This content couldn"), `${pathname} contains the invalid-document fallback`);
  return body;
}

async function main() {
  const [projects, labs, articles, certificates, tag] = await Promise.all([
    prisma.project.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true, title: true },
    }),
    prisma.lab.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true, title: true },
    }),
    prisma.article.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true, title: true },
    }),
    prisma.certificate.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { name: true },
    }),
    prisma.tag.findFirst({
      where: {
        OR: [
          { projects: { some: { publishStatus: "PUBLISHED" } } },
          { labs: { some: { publishStatus: "PUBLISHED" } } },
          { articles: { some: { publishStatus: "PUBLISHED" } } },
        ],
      },
      select: {
        name: true,
        slug: true,
        projects: {
          where: { publishStatus: "PUBLISHED" },
          select: { title: true },
        },
        labs: {
          where: { publishStatus: "PUBLISHED" },
          select: { title: true },
        },
        articles: {
          where: { publishStatus: "PUBLISHED" },
          select: { title: true },
        },
      },
    }),
  ]);

  const home = await get("/");
  const projectList = await get("/projects");
  const labList = await get("/labs");
  const articleList = await get("/journal");
  const certificateList = await get("/certifications");
  await Promise.all(["/timeline", "/skills"].map(get));

  for (const project of projects) {
    assert(projectList.includes(project.title), `/projects is missing ${project.slug}`);
    const detail = await get(`/projects/${project.slug}`);
    assert(detail.includes(project.title), `/projects/${project.slug} is missing its title`);
    assert(home.includes(project.title), `search payload is missing Project ${project.slug}`);
  }
  for (const lab of labs) {
    assert(labList.includes(lab.title), `/labs is missing ${lab.slug}`);
    const detail = await get(`/labs/${lab.slug}`);
    assert(detail.includes(lab.title), `/labs/${lab.slug} is missing its title`);
    assert(home.includes(lab.title), `search payload is missing Lab ${lab.slug}`);
  }
  for (const article of articles) {
    assert(articleList.includes(article.title), `/journal is missing ${article.slug}`);
    const detail = await get(`/journal/${article.slug}`);
    assert(detail.includes(article.title), `/journal/${article.slug} is missing its title`);
    assert(home.includes(article.title), `search payload is missing Article ${article.slug}`);
  }
  for (const certificate of certificates) {
    assert(certificateList.includes(certificate.name), `/certifications is missing ${certificate.name}`);
    assert(home.includes(certificate.name), `search payload is missing Certificate ${certificate.name}`);
  }

  assert(tag, "No published tag was available for route verification");
  const tagPage = await get(`/tags/${tag.slug}`);
  const taggedTitles = [...tag.projects, ...tag.labs, ...tag.articles].map((item) => item.title);
  for (const title of taggedTitles) {
    assert(tagPage.includes(title), `/tags/${tag.slug} is missing ${title}`);
  }

  const sitemap = await get("/sitemap.xml");
  const expectedDetailPaths = [
    ...projects.map((item) => `/projects/${item.slug}`),
    ...labs.map((item) => `/labs/${item.slug}`),
    ...articles.map((item) => `/journal/${item.slug}`),
    `/tags/${tag.slug}`,
  ];
  for (const pathname of expectedDetailPaths) {
    assert(sitemap.includes(pathname), `sitemap is missing ${pathname}`);
  }
  const publishedTagCount = await prisma.tag.count({
    where: {
      OR: [
        { projects: { some: { publishStatus: "PUBLISHED" } } },
        { labs: { some: { publishStatus: "PUBLISHED" } } },
        { articles: { some: { publishStatus: "PUBLISHED" } } },
      ],
    },
  });
  const sitemapUrlCount = (sitemap.match(/<url>/g) ?? []).length;
  const expectedSitemapUrls = 10 + projects.length + labs.length + articles.length + publishedTagCount;
  assert(
    sitemapUrlCount === expectedSitemapUrls,
    `sitemap URL count ${sitemapUrlCount} did not match expected ${expectedSitemapUrls}`
  );

  console.log(
    `[site-verify] projects=${projects.length} labs=${labs.length} articles=${articles.length} certificates=${certificates.length} tags=${publishedTagCount} sitemapUrls=${sitemapUrlCount}`
  );
  console.log(`[site-verify] tag=${tag.slug} taggedItems=${taggedTitles.length} routes=ok search=ok sitemap=ok`);
}

main()
  .catch((error) => {
    console.error(`[site-verify] failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
