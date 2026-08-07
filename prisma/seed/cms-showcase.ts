import type { PrismaClient } from "@prisma/client";
import { toPrismaJson } from "@/lib/prisma-json";
import type { TipTapDoc } from "@/types/tiptap";
import { validateTipTapDoc } from "@/lib/validations/content";

export const CMS_SHOWCASE_SLUG = "cybersecurity-portfolio-cms";

const cmsShowcaseContent: TipTapDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This portfolio began as a file-backed documentation site and was migrated into an authenticated content management system without replacing its public design.",
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Architecture" }] },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Next.js App Router renders the public portfolio and private admin interface. Prisma models Projects, Labs, Articles, Certificates, Timeline entries, Skills, Tags, Categories, Media, and site settings in PostgreSQL on Neon.",
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Content workflow" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "GitHub OAuth protects the single-owner admin area and every mutation independently checks the admin session." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "TipTap stores validated JSON documents and autosave uses revision ordering, database read-back, and structured results." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Server Actions revalidate collections, details, tags, search, sitemap, and shared settings after confirmed writes." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Strict build-data checks prevent database failures from becoming successful empty static pages." }] }] },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Reliability work" }] },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "The migration included record-level content auditing, bounded retries for transient idempotent reads, direct tag queries, accessible destructive dialogs, route-specific loading states, and a database-backed CMS dashboard.",
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Result" }] },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "The public routes remain statically generated and searchable while authenticated edits can be published without a redeploy. The seed path for this showcase is idempotent, so a clean database can reproduce the project without overwriting later owner edits.",
        },
      ],
    },
  ],
};

export async function seedCmsShowcaseProject(prisma: PrismaClient) {
  const existing = await prisma.project.findUnique({
    where: { slug: CMS_SHOWCASE_SLUG },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };
  const validatedContent = validateTipTapDoc(cmsShowcaseContent);
  if (!validatedContent.success) {
    throw new Error("The CMS showcase document failed TipTap validation.");
  }

  const project = await prisma.project.create({
    data: {
      title: "Cybersecurity Portfolio CMS",
      slug: CMS_SHOWCASE_SLUG,
      summary:
        "An authenticated, database-backed CMS migration for this cybersecurity portfolio, with validated rich content, reliable autosave, strict builds, and on-demand route revalidation.",
      content: toPrismaJson(validatedContent.data),
      difficulty: "ADVANCED",
      progressStatus: "COMPLETED",
      publishStatus: "PUBLISHED",
      technologies: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Neon", "TipTap", "Auth.js", "Vercel Blob"],
      estimatedTime: "Multi-phase migration",
      completionDate: new Date("2026-07-28T00:00:00.000Z"),
      publishedAt: new Date(),
      category: {
        connectOrCreate: {
          where: { slug: "web-development" },
          create: { name: "Web Development", slug: "web-development" },
        },
      },
      tags: {
        connectOrCreate: ["CMS", "Next.js", "Prisma", "PostgreSQL", "TipTap"].map((name) => ({
          where: { slug: name.toLowerCase().replace(/\./g, "").replace(/\s+/g, "-") },
          create: { name, slug: name.toLowerCase().replace(/\./g, "").replace(/\s+/g, "-") },
        })),
      },
    },
    select: { id: true },
  });
  return { id: project.id, created: true };
}
