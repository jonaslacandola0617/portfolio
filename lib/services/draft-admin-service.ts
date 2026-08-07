import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getTemplateDocument, templateCatalog, type TemplateContentType } from "@/lib/editor/templates";
import { toPrismaJson } from "@/lib/prisma-json";

const DRAFT_CATEGORY = "Uncategorized";

function draftSlug(contentType: TemplateContentType) {
  return `${contentType}-draft-${randomUUID().slice(0, 8)}`;
}

function assertTemplate(contentType: TemplateContentType, templateId: string) {
  const template = templateCatalog.find(
    (item) => item.contentType === contentType && item.id === templateId,
  );
  if (!template) throw new Error("VALIDATION: Select a valid content template.");
  return template;
}

const categoryRelation = {
  connectOrCreate: {
    where: { slug: "uncategorized" },
    create: { name: DRAFT_CATEGORY, slug: "uncategorized" },
  },
} as const;

export async function createDraftFromTemplate(
  contentType: TemplateContentType,
  templateId: string,
): Promise<{ id: string }> {
  assertTemplate(contentType, templateId);
  const now = new Date();
  const content = toPrismaJson(getTemplateDocument(templateId, contentType));

  if (contentType === "project") {
    return prisma.project.create({
      data: {
        title: "Untitled Project",
        slug: draftSlug(contentType),
        summary: "Draft project — update the metadata before publishing.",
        content,
        difficulty: "INTERMEDIATE",
        progressStatus: "PLANNED",
        publishStatus: "DRAFT",
        category: categoryRelation,
        technologies: [],
        completionDate: now,
      },
      select: { id: true },
    });
  }

  if (contentType === "lab") {
    return prisma.lab.create({
      data: {
        title: "Untitled Lab",
        slug: draftSlug(contentType),
        purpose: "Draft lab — update the metadata before publishing.",
        content,
        difficulty: "INTERMEDIATE",
        progressStatus: "PLANNED",
        publishStatus: "DRAFT",
        category: categoryRelation,
        labDate: now,
      },
      select: { id: true },
    });
  }

  return prisma.article.create({
    data: {
      title: "Untitled Journal Entry",
      slug: draftSlug(contentType),
      summary: "Draft journal entry — update the metadata before publishing.",
      content,
      publishStatus: "DRAFT",
      category: categoryRelation,
      date: now,
    },
    select: { id: true },
  });
}
