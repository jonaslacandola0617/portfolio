import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PrismaClient } from "@prisma/client";
import { mdxBodyToTipTapDoc } from "./mdx-to-tiptap";
import { validateTipTapDoc } from "@/lib/validations/content";
import { toPrismaJson } from "@/lib/prisma-json";
import { skillCategories } from "@/lib/data/skills";
import { certifications } from "@/lib/data/certifications";
import { timelineEntries } from "@/lib/data/timeline";
import { slugify } from "@/lib/utils";
import { seedCmsShowcaseProject } from "./cms-showcase";
import { siteConfig } from "@/lib/site-config";
import { defaultAboutPage } from "@/lib/about-defaults";

const prisma = new PrismaClient();

const skillLookup = new Map<string, { group: string; level: string }>();
for (const category of skillCategories) {
  for (const skill of category.skills) {
    skillLookup.set(skill.name, { group: category.category, level: skill.level });
  }
}

interface ProjectFrontmatterRaw {
  title: string;
  slug: string;
  summary: string;
  category: string;
  difficulty: string;
  status: string;
  tags: string[];
  technologies: string[];
  skills: string[];
  estimatedTime: string;
  completionDate: string;
  githubUrl?: string;
  downloads?: { label: string; href: string; type: string }[];
  relatedCertification?: string;
}

interface LabFrontmatterRaw {
  title: string;
  slug: string;
  purpose: string;
  date: string;
  status: string;
  difficulty: string;
  tags: string[];
  category: string;
}

interface ArticleFrontmatterRaw {
  title: string;
  slug: string;
  summary: string;
  date: string;
  tags: string[];
  category: string;
}

function convertAndValidate(filename: string, content: string) {
  const doc = mdxBodyToTipTapDoc(content);
  const validation = validateTipTapDoc(doc);
  if (!validation.success) {
    console.error(`  ✗ ${filename}: TipTap conversion failed Zod validation, skipping.`);
    console.error(validation.error.message);
    return null;
  }
  return validation.data;
}

async function seedProjects() {
  const dir = path.join(process.cwd(), "content/projects");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  console.log(`\nSeeding ${files.length} projects from content/projects/...\n`);

  for (const filename of files) {
    const raw = fs.readFileSync(path.join(dir, filename), "utf8");
    const { data, content } = matter(raw);
    const fm = data as ProjectFrontmatterRaw;

    const validated = convertAndValidate(filename, content);
    if (!validated) continue;

    const project = await prisma.project.upsert({
      where: { slug: fm.slug },
      create: {
        title: fm.title,
        slug: fm.slug,
        summary: fm.summary,
        content: toPrismaJson(validated),
        difficulty: fm.difficulty.toUpperCase() as never,
        progressStatus: fm.status.toUpperCase().replace(/-/g, "_") as never,
        publishStatus: "PUBLISHED",
        estimatedTime: fm.estimatedTime,
        completionDate: new Date(fm.completionDate),
        githubUrl: fm.githubUrl,
        technologies: fm.technologies ?? [],
        publishedAt: new Date(),
        category: {
          connectOrCreate: {
            where: { slug: slugify(fm.category) },
            create: { name: fm.category, slug: slugify(fm.category) },
          },
        },
        tags: {
          connectOrCreate: fm.tags.map((tag) => ({
            where: { slug: slugify(tag) },
            create: { name: tag, slug: slugify(tag) },
          })),
        },
        skills: {
          connectOrCreate: (fm.skills ?? []).map((skill) => ({
            where: { name: skill },
            create: {
              name: skill,
              group: skillLookup.get(skill)?.group ?? "Ungrouped",
              level: skillLookup.get(skill)?.level ?? "practiced",
            },
          })),
        },
        downloads: {
          create: (fm.downloads ?? []).map((d) => ({ label: d.label, url: d.href, type: d.type })),
        },
      },
      update: {
        title: fm.title,
        summary: fm.summary,
        content: toPrismaJson(validated),
        difficulty: fm.difficulty.toUpperCase() as never,
        progressStatus: fm.status.toUpperCase().replace(/-/g, "_") as never,
        estimatedTime: fm.estimatedTime,
        completionDate: new Date(fm.completionDate),
        githubUrl: fm.githubUrl,
        technologies: fm.technologies ?? [],
      },
    });
    console.log(`  ✓ ${filename} → Project ${project.id} (${project.slug})`);
  }
}

async function seedLabs() {
  const dir = path.join(process.cwd(), "content/labs");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  console.log(`\nSeeding ${files.length} labs from content/labs/...\n`);

  for (const filename of files) {
    const raw = fs.readFileSync(path.join(dir, filename), "utf8");
    const { data, content } = matter(raw);
    const fm = data as LabFrontmatterRaw;

    const validated = convertAndValidate(filename, content);
    if (!validated) continue;

    const lab = await prisma.lab.upsert({
      where: { slug: fm.slug },
      create: {
        title: fm.title,
        slug: fm.slug,
        purpose: fm.purpose,
        content: toPrismaJson(validated),
        difficulty: fm.difficulty.toUpperCase() as never,
        progressStatus: fm.status.toUpperCase().replace(/-/g, "_") as never,
        publishStatus: "PUBLISHED",
        labDate: new Date(fm.date),
        publishedAt: new Date(),
        category: {
          connectOrCreate: {
            where: { slug: slugify(fm.category) },
            create: { name: fm.category, slug: slugify(fm.category) },
          },
        },
        tags: {
          connectOrCreate: fm.tags.map((tag) => ({
            where: { slug: slugify(tag) },
            create: { name: tag, slug: slugify(tag) },
          })),
        },
      },
      update: {
        title: fm.title,
        purpose: fm.purpose,
        content: toPrismaJson(validated),
        difficulty: fm.difficulty.toUpperCase() as never,
        progressStatus: fm.status.toUpperCase().replace(/-/g, "_") as never,
        labDate: new Date(fm.date),
      },
    });
    console.log(`  ✓ ${filename} → Lab ${lab.id} (${lab.slug})`);
  }
}

async function seedArticles() {
  const dir = path.join(process.cwd(), "content/articles");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  console.log(`\nSeeding ${files.length} articles from content/articles/...\n`);

  for (const filename of files) {
    const raw = fs.readFileSync(path.join(dir, filename), "utf8");
    const { data, content } = matter(raw);
    const fm = data as ArticleFrontmatterRaw;

    const validated = convertAndValidate(filename, content);
    if (!validated) continue;

    const article = await prisma.article.upsert({
      where: { slug: fm.slug },
      create: {
        title: fm.title,
        slug: fm.slug,
        summary: fm.summary,
        content: toPrismaJson(validated),
        publishStatus: "PUBLISHED",
        date: new Date(fm.date),
        publishedAt: new Date(),
        category: {
          connectOrCreate: {
            where: { slug: slugify(fm.category) },
            create: { name: fm.category, slug: slugify(fm.category) },
          },
        },
        tags: {
          connectOrCreate: fm.tags.map((tag) => ({
            where: { slug: slugify(tag) },
            create: { name: tag, slug: slugify(tag) },
          })),
        },
      },
      update: {
        title: fm.title,
        summary: fm.summary,
        content: toPrismaJson(validated),
        date: new Date(fm.date),
      },
    });
    console.log(`  ✓ ${filename} → Article ${article.id} (${article.slug})`);
  }
}

async function seedCertificates() {
  console.log(`\nSeeding ${certifications.length} certificates from lib/data/certifications.ts...\n`);

  for (const cert of certifications) {
    const record = await prisma.certificate.upsert({
      where: { slug: cert.id },
      create: {
        slug: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        logo: cert.logo,
        progressStatus: "COMPLETED",
        publishStatus: "PUBLISHED",
        progressLabel: "Completed",
        progressPercent: 100,
        dateStarted: cert.dateStarted ? new Date(`${cert.dateStarted}T00:00:00.000Z`) : undefined,
        dateCompleted: cert.dateCompleted ? new Date(`${cert.dateCompleted}T00:00:00.000Z`) : undefined,
        credentialUrl: cert.credentialUrl,
        publishedAt: new Date(),
        skills: {
          connectOrCreate: cert.skills.map((skill) => ({
            where: { name: skill },
            create: {
              name: skill,
              group: skillLookup.get(skill)?.group ?? "Ungrouped",
              level: skillLookup.get(skill)?.level ?? "practiced",
            },
          })),
        },
      },
      update: {
        name: cert.name,
        issuer: cert.issuer,
        logo: cert.logo,
        progressStatus: "COMPLETED",
        progressLabel: "Completed",
        progressPercent: 100,
        dateStarted: cert.dateStarted ? new Date(`${cert.dateStarted}T00:00:00.000Z`) : null,
        dateCompleted: cert.dateCompleted ? new Date(`${cert.dateCompleted}T00:00:00.000Z`) : null,
      },
    });
    console.log(`  ✓ ${cert.id} → Certificate ${record.id} (slug: ${record.slug})`);
  }
}

/** Phase 2's seed script deliberately skipped Project↔Certificate links —
 *  Certificate rows didn't exist yet. Reconciling now that they do. */
async function reconcileProjectCertificates() {
  console.log(`\nReconciling Project ↔ Certificate links...\n`);
  const dir = path.join(process.cwd(), "content/projects");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  for (const filename of files) {
    const raw = fs.readFileSync(path.join(dir, filename), "utf8");
    const { data } = matter(raw);
    const fm = data as ProjectFrontmatterRaw;
    if (!fm.relatedCertification) continue;

    await prisma.project.update({
      where: { slug: fm.slug },
      data: { certificates: { connect: { slug: fm.relatedCertification } } },
    });
    console.log(`  ✓ ${fm.slug} ↔ ${fm.relatedCertification}`);
  }
}

async function seedTimeline() {
  console.log(`\nSeeding ${timelineEntries.length} timeline entries from lib/data/timeline.ts...\n`);

  for (const entry of timelineEntries) {
    // No natural unique key in the source data other than (date, title) —
    // used together as an idempotency check since TimelineEntry has no
    // slug of its own (see schema.prisma comment).
    const existing = await prisma.timelineEntry.findFirst({
      where: { date: new Date(entry.date), title: entry.title },
    });
    if (existing) {
      console.log(`  = ${entry.title} (already seeded, skipping)`);
      continue;
    }
    const created = await prisma.timelineEntry.create({
      data: {
        date: new Date(entry.date),
        title: entry.title,
        description: entry.description,
        category: entry.category,
        publishStatus: "PUBLISHED",
        publishedAt: new Date(),
        tags: {
          connectOrCreate: (entry.tags ?? []).map((tag) => ({
            where: { slug: slugify(tag) },
            create: { name: tag, slug: slugify(tag) },
          })),
        },
      },
    });
    console.log(`  ✓ ${entry.title} → TimelineEntry ${created.id}`);
  }
}

/** Ensures every skill in lib/data/skills.ts exists with correct
 *  group/level, independent of whether a Project or Certificate already
 *  created it via connectOrCreate during their own seeding. */
async function seedSkills() {
  const allSkills = skillCategories.flatMap((c) =>
    c.skills.map((s) => ({ ...s, group: c.category }))
  );
  console.log(`\nSeeding ${allSkills.length} skills from lib/data/skills.ts...\n`);

  for (const skill of allSkills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      create: { name: skill.name, group: skill.group, level: skill.level },
      update: { group: skill.group, level: skill.level },
    });
    console.log(`  ✓ ${skill.name}`);
  }
}

async function seedSiteSettings() {
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
      aboutPage: toPrismaJson(defaultAboutPage),
    },
    update: {},
  });
  console.log("  ✓ SiteSettings singleton");
}

async function main() {
  await seedProjects();
  const showcase = await seedCmsShowcaseProject(prisma);
  console.log(`  ${showcase.created ? "✓" : "="} Cybersecurity Portfolio CMS (${showcase.created ? "created" : "already seeded"})`);
  await seedLabs();
  await seedArticles();
  await seedSkills();
  await seedCertificates();
  await reconcileProjectCertificates();
  await seedTimeline();
  await seedSiteSettings();
  console.log("\nDone.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
