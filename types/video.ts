import type { TipTapDoc } from "@/types/tiptap";

export type VideoDisciplineName = "VIDEO_EDITING" | "CINEMATOGRAPHY";

export interface VideoProjectData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: TipTapDoc;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  disciplines: VideoDisciplineName[];
  roles: string[];
  tools: string[];
  client?: string;
  runtime?: string;
  customPosterUrl?: string;
  completionDate?: string;
  publishStatus: string;
  sortOrder: number;
  publishedAt?: string;
  updatedAt: string;
}

export interface VideoPortfolioSettingsData {
  eyebrow: string;
  headline: string;
  intro: string;
  aboutHeading: string;
  aboutBody: string;
  videoEditingDescription: string;
  cinematographyDescription: string;
  heroVideoId?: string;
  featuredVideoIds: string[];
}
