import "server-only";

import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import { youtubeThumbnailUrl } from "@/lib/youtube";
import { defaultVideoPortfolioSettings } from "@/lib/video-defaults";
import type { TipTapDoc } from "@/types/tiptap";
import type { VideoPortfolioSettingsData, VideoProjectData } from "@/types/video";

const videoProjectInclude = {
  customPoster: { select: { url: true } },
} satisfies Prisma.VideoProjectInclude;

type VideoProjectRecord = Prisma.VideoProjectGetPayload<{
  include: typeof videoProjectInclude;
}>;

function toDateOnly(date: Date | null): string | undefined {
  return date?.toISOString().slice(0, 10);
}

function mapVideoProject(project: VideoProjectRecord): VideoProjectData {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    content: project.content as TipTapDoc,
    youtubeUrl: project.youtubeUrl ?? undefined,
    youtubeVideoId: project.youtubeVideoId ?? undefined,
    disciplines: project.disciplines,
    roles: project.roles,
    tools: project.tools,
    client: project.client ?? undefined,
    runtime: project.runtime ?? undefined,
    customPosterUrl:
      project.customPoster?.url ??
      (project.youtubeVideoId ? youtubeThumbnailUrl(project.youtubeVideoId) ?? undefined : undefined),
    completionDate: toDateOnly(project.completionDate),
    publishStatus: project.publishStatus,
    sortOrder: project.sortOrder,
    publishedAt: project.publishedAt?.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function mapSettings(
  settings: {
    eyebrow: string;
    headline: string;
    intro: string;
    aboutHeading: string;
    aboutBody: string;
    videoEditingDescription: string;
    cinematographyDescription: string;
    heroVideoId: string | null;
    featuredVideoIds: string[];
  } | null,
  publishedIds: Set<string>,
): VideoPortfolioSettingsData {
  if (!settings) return { ...defaultVideoPortfolioSettings };

  const featuredVideoIds = [...new Set(settings.featuredVideoIds)]
    .filter((id) => publishedIds.has(id))
    .slice(0, 3);
  const heroVideoId = settings.heroVideoId && publishedIds.has(settings.heroVideoId)
    ? settings.heroVideoId
    : undefined;

  return {
    eyebrow: settings.eyebrow,
    headline: settings.headline,
    intro: settings.intro,
    aboutHeading: settings.aboutHeading,
    aboutBody: settings.aboutBody,
    videoEditingDescription: settings.videoEditingDescription,
    cinematographyDescription: settings.cinematographyDescription,
    heroVideoId,
    featuredVideoIds,
  };
}

export const getPublishedVideoProjects = cache(async (): Promise<VideoProjectData[]> =>
  readWithPolicy("video.getPublishedVideoProjects", [], async () => {
    const projects = await prisma.videoProject.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: videoProjectInclude,
      orderBy: [{ sortOrder: "asc" }, { completionDate: "desc" }, { updatedAt: "desc" }],
    });
    return projects.map(mapVideoProject);
  }),
);

export const getVideoProjectBySlug = cache(
  async (slug: string): Promise<VideoProjectData | undefined> =>
    readWithPolicy(`video.getVideoProjectBySlug(${slug})`, undefined, async () => {
      const project = await prisma.videoProject.findFirst({
        where: { slug, publishStatus: "PUBLISHED" },
        include: videoProjectInclude,
      });
      return project ? mapVideoProject(project) : undefined;
    }),
);

export const getAllPublishedVideoSlugs = cache(async (): Promise<string[]> =>
  readWithPolicy("video.getAllPublishedVideoSlugs", [], async () => {
    const projects = await prisma.videoProject.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true },
    });
    return projects.map((project) => project.slug);
  }),
);

export const getVideoPortfolioSettings = cache(async (): Promise<VideoPortfolioSettingsData> =>
  readWithPolicy("video.getVideoPortfolioSettings", defaultVideoPortfolioSettings, async () => {
    const [settings, projects] = await Promise.all([
      prisma.videoPortfolioSettings.findUnique({ where: { id: "singleton" } }),
      prisma.videoProject.findMany({
        where: { publishStatus: "PUBLISHED" },
        select: { id: true },
      }),
    ]);
    return mapSettings(settings, new Set(projects.map((project) => project.id)));
  }),
);
