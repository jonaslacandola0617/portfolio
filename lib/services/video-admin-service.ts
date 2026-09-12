import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emptyTemplate } from "@/lib/editor/templates";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";
import { parseYouTubeUrl } from "@/lib/youtube";
import { defaultVideoPortfolioSettings } from "@/lib/video-defaults";
import type { VideoHomepageSettingsValues, VideoProjectFormValues } from "@/lib/validations/video";
import type { TipTapDoc } from "@/types/tiptap";
import type { HomepageShowcaseResult } from "@/types/admin";

export interface AdminVideoProjectListItem {
  id: string;
  title: string;
  slug: string;
  disciplines: string[];
  publishStatus: string;
  completionDate: Date | null;
  sortOrder: number;
  updatedAt: Date;
}

export interface AdminVideoProjectDetail {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  disciplines: string[];
  roles: string[];
  tools: string[];
  client: string | null;
  runtime: string | null;
  customPosterId: string | null;
  completionDate: Date | null;
  publishStatus: string;
  scheduledFor: Date | null;
  sortOrder: number;
}

const settingsCreateData = {
  id: "singleton",
  eyebrow: defaultVideoPortfolioSettings.eyebrow,
  headline: defaultVideoPortfolioSettings.headline,
  intro: defaultVideoPortfolioSettings.intro,
  aboutHeading: defaultVideoPortfolioSettings.aboutHeading,
  aboutBody: defaultVideoPortfolioSettings.aboutBody,
  videoEditingDescription: defaultVideoPortfolioSettings.videoEditingDescription,
  cinematographyDescription: defaultVideoPortfolioSettings.cinematographyDescription,
  heroVideoId: null,
  featuredVideoIds: [],
} as const;

function parseOptionalDate(value: string | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function parseOptionalDateTime(value: string | undefined): Date | null {
  return value ? new Date(value) : null;
}

async function validatePoster(mediaId: string | undefined) {
  if (!mediaId) return null;
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true, type: true },
  });
  if (!media || media.type !== "IMAGE") {
    throw new Error("The selected custom poster is not an available Media Library image.");
  }
  return media.id;
}

async function cleanVideoFromSettings(
  videoId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const settings = await client.videoPortfolioSettings.findUnique({
    where: { id: "singleton" },
    select: { heroVideoId: true, featuredVideoIds: true },
  });
  if (!settings) return;

  const featuredVideoIds = settings.featuredVideoIds.filter((id) => id !== videoId);
  const heroVideoId = settings.heroVideoId === videoId ? null : settings.heroVideoId;
  if (
    heroVideoId !== settings.heroVideoId ||
    featuredVideoIds.length !== settings.featuredVideoIds.length
  ) {
    await client.videoPortfolioSettings.update({
      where: { id: "singleton" },
      data: { heroVideoId, featuredVideoIds },
    });
  }
}

export async function getVideoDashboardData() {
  const [total, published, draft, recent] = await Promise.all([
    prisma.videoProject.count(),
    prisma.videoProject.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.videoProject.count({ where: { publishStatus: "DRAFT" } }),
    prisma.videoProject.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        publishStatus: true,
        disciplines: true,
        updatedAt: true,
      },
    }),
  ]);
  return { total, published, draft, recent };
}

export async function getAllVideoProjectsForAdmin(): Promise<AdminVideoProjectListItem[]> {
  return prisma.videoProject.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      disciplines: true,
      publishStatus: true,
      completionDate: true,
      sortOrder: true,
      updatedAt: true,
    },
  }) as Promise<AdminVideoProjectListItem[]>;
}

export async function getVideoProjectForEdit(id: string): Promise<AdminVideoProjectDetail | null> {
  return prisma.videoProject.findUnique({ where: { id } }) as Promise<AdminVideoProjectDetail | null>;
}

export async function getPublishedVideoChoices() {
  return prisma.videoProject.findMany({
    where: { publishStatus: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      disciplines: true,
      youtubeVideoId: true,
      customPoster: { select: { url: true } },
    },
  });
}

export async function getVideoHomepageSettingsForAdmin() {
  const [settings, publishedVideos] = await Promise.all([
    prisma.videoPortfolioSettings.findUnique({ where: { id: "singleton" } }),
    getPublishedVideoChoices(),
  ]);
  return {
    settings: settings ?? settingsCreateData,
    publishedVideos,
  };
}

export async function createVideoDraft() {
  const maxSort = await prisma.videoProject.aggregate({ _max: { sortOrder: true } });
  const suffix = Date.now().toString(36);
  const project = await prisma.videoProject.create({
    data: {
      title: "Untitled video",
      slug: `untitled-video-${suffix}`,
      summary: "",
      content: toPrismaJson(emptyTemplate),
      disciplines: [],
      roles: [],
      tools: [],
      publishStatus: "DRAFT",
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  revalidateContent("video");
  return project;
}

export async function updateVideoProjectMetadata(id: string, values: VideoProjectFormValues) {
  const existing = await prisma.videoProject.findUnique({
    where: { id },
    select: { slug: true, publishStatus: true },
  });
  if (!existing) throw new Error("Video project not found.");

  const youtube = values.youtubeUrl ? parseYouTubeUrl(values.youtubeUrl) : null;
  const customPosterId = await validatePoster(values.customPosterId || undefined);

  const project = await prisma.videoProject.update({
    where: { id },
    data: {
      title: values.title,
      slug: values.slug,
      summary: values.summary,
      youtubeUrl: youtube?.watchUrl ?? null,
      youtubeVideoId: youtube?.videoId ?? null,
      disciplines: values.disciplines,
      roles: values.roles,
      tools: values.tools,
      client: values.client || null,
      runtime: values.runtime || null,
      customPosterId,
      completionDate: parseOptionalDate(values.completionDate || undefined),
      publishStatus: values.publishStatus,
      scheduledFor: parseOptionalDateTime(values.scheduledFor || undefined),
      ...(values.publishStatus === "PUBLISHED" && existing.publishStatus !== "PUBLISHED"
        ? { publishedAt: new Date() }
        : {}),
    },
  });

  if (project.publishStatus !== "PUBLISHED") {
    await cleanVideoFromSettings(project.id);
  }

  revalidateContent("video", [existing.slug, project.slug]);
  revalidateContent("videoSettings");
  return project;
}

export async function updateVideoProjectContent(id: string, content: TipTapDoc) {
  const project = await prisma.videoProject.update({
    where: { id },
    data: { content: toPrismaJson(content) },
    select: { slug: true, publishStatus: true },
  });
  if (project.publishStatus === "PUBLISHED") revalidateContent("video", [project.slug]);
  const readBack = await prisma.videoProject.findUnique({ where: { id }, select: { content: true } });
  return readBack?.content;
}

export async function deleteVideoProject(id: string) {
  const project = await prisma.$transaction(async (tx) => {
    const deleted = await tx.videoProject.delete({ where: { id }, select: { slug: true } });
    await cleanVideoFromSettings(id, tx);
    return deleted;
  });
  revalidateContent("video", [project.slug]);
  revalidateContent("videoSettings");
}

export async function deleteVideoProjects(ids: string[]): Promise<number> {
  const slugs = await prisma.$transaction(async (tx) => {
    const records = await tx.videoProject.findMany({ where: { id: { in: ids } }, select: { id: true, slug: true } });
    await tx.videoProject.deleteMany({ where: { id: { in: ids } } });
    for (const record of records) await cleanVideoFromSettings(record.id, tx);
    return records.map((record) => record.slug);
  });
  revalidateContent("video", slugs);
  revalidateContent("videoSettings");
  return slugs.length;
}

export async function reorderVideoProjects(ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length !== ids.length) throw new Error("Video order contains duplicate records.");

  const existing = await prisma.videoProject.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((item) => item.id));
  if (unique.length !== existing.length || unique.some((id) => !existingIds.has(id))) {
    throw new Error("Video order must include every current video project exactly once.");
  }

  await prisma.$transaction(
    unique.map((id, sortOrder) => prisma.videoProject.update({ where: { id }, data: { sortOrder } })),
  );
  revalidateContent("video");
}

export async function setVideoHomepageFeature(
  projectId: string,
  showcased: boolean,
): Promise<HomepageShowcaseResult> {
  return prisma.$transaction(
    async (tx) => {
      await tx.videoPortfolioSettings.upsert({
        where: { id: "singleton" },
        create: settingsCreateData,
        update: {},
      });
      await tx.$queryRaw`
        SELECT "id" FROM "VideoPortfolioSettings"
        WHERE "id" = 'singleton' FOR UPDATE
      `;

      const [project, settings] = await Promise.all([
        tx.videoProject.findUnique({ where: { id: projectId }, select: { id: true, publishStatus: true } }),
        tx.videoPortfolioSettings.findUnique({ where: { id: "singleton" }, select: { featuredVideoIds: true } }),
      ]);
      if (!project) return { success: false, message: "This video project no longer exists." };
      if (!settings) return { success: false, message: "Video homepage settings are unavailable." };

      const published = await tx.videoProject.findMany({
        where: { id: { in: settings.featuredVideoIds }, publishStatus: "PUBLISHED" },
        select: { id: true },
      });
      const validIds = new Set(published.map((item) => item.id));
      const selectedIds = [...new Set(settings.featuredVideoIds)].filter((id) => validIds.has(id));

      if (showcased) {
        if (project.publishStatus !== "PUBLISHED") {
          return { success: false, message: "Publish this video before featuring it on the Video homepage." };
        }
        if (!selectedIds.includes(projectId) && selectedIds.length >= 3) {
          return { success: false, message: "The Video homepage already has three featured projects. Remove one first." };
        }
        if (!selectedIds.includes(projectId)) selectedIds.push(projectId);
      } else {
        const index = selectedIds.indexOf(projectId);
        if (index >= 0) selectedIds.splice(index, 1);
      }

      await tx.videoPortfolioSettings.update({
        where: { id: "singleton" },
        data: { featuredVideoIds: selectedIds },
      });
      return {
        success: true,
        selectedIds,
        message: showcased ? "Video added to featured work." : "Video removed from featured work.",
      };
    },
    { isolationLevel: "Serializable" },
  );
}

export async function updateVideoHomepageSettings(values: VideoHomepageSettingsValues) {
  const requestedIds = [...new Set([
    ...values.featuredVideoIds,
    ...(values.heroVideoId ? [values.heroVideoId] : []),
  ])];
  const published = requestedIds.length
    ? await prisma.videoProject.findMany({
        where: { id: { in: requestedIds }, publishStatus: "PUBLISHED" },
        select: { id: true },
      })
    : [];
  const publishedIds = new Set(published.map((item) => item.id));
  if (requestedIds.some((id) => !publishedIds.has(id))) {
    throw new Error("Hero and featured selections must reference published Video projects.");
  }

  const settings = await prisma.videoPortfolioSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      eyebrow: values.eyebrow,
      headline: values.headline,
      intro: values.intro,
      aboutHeading: values.aboutHeading,
      aboutBody: values.aboutBody,
      videoEditingDescription: values.videoEditingDescription,
      cinematographyDescription: values.cinematographyDescription,
      heroVideoId: values.heroVideoId || null,
      featuredVideoIds: values.featuredVideoIds,
    },
    update: {
      eyebrow: values.eyebrow,
      headline: values.headline,
      intro: values.intro,
      aboutHeading: values.aboutHeading,
      aboutBody: values.aboutBody,
      videoEditingDescription: values.videoEditingDescription,
      cinematographyDescription: values.cinematographyDescription,
      heroVideoId: values.heroVideoId || null,
      featuredVideoIds: values.featuredVideoIds,
    },
  });
  revalidateContent("videoSettings");
  return settings;
}
