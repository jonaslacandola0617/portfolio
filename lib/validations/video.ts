import { z } from "zod";
import { parseYouTubeUrl } from "@/lib/youtube";

export const videoDisciplineSchema = z.enum(["VIDEO_EDITING", "CINEMATOGRAPHY"]);
export type VideoDisciplineValue = z.infer<typeof videoDisciplineSchema>;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalDate = z.string().trim().refine(
  (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
  "Use a valid date.",
);

export const videoProjectFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  slug: z.string().trim().min(1, "Slug is required.").max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  summary: z.string().trim().max(500),
  youtubeUrl: z.string().trim().max(500),
  disciplines: z.array(videoDisciplineSchema).max(2),
  roles: z.array(z.string().trim().min(1).max(80)).max(20),
  tools: z.array(z.string().trim().min(1).max(80)).max(30),
  client: optionalText(160),
  runtime: optionalText(40),
  customPosterId: optionalText(128),
  completionDate: optionalDate,
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  scheduledFor: z.string().trim().max(40).optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.youtubeUrl && !parseYouTubeUrl(value.youtubeUrl)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["youtubeUrl"], message: "Enter a supported YouTube URL." });
  }

  if (value.publishStatus === "PUBLISHED") {
    if (!value.summary) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["summary"], message: "Add a summary before publishing." });
    }
    if (!value.youtubeUrl || !parseYouTubeUrl(value.youtubeUrl)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["youtubeUrl"], message: "A valid YouTube video is required before publishing." });
    }
    if (!value.disciplines.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["disciplines"], message: "Select Video Editing, Cinematography, or both before publishing." });
    }
  }
});

export type VideoProjectFormValues = z.infer<typeof videoProjectFormSchema>;

export const videoHomepageSettingsSchema = z.object({
  eyebrow: z.string().trim().min(1).max(80),
  headline: z.string().trim().min(1).max(160),
  intro: z.string().trim().min(1).max(700),
  aboutHeading: z.string().trim().min(1).max(160),
  aboutBody: z.string().trim().min(1).max(1200),
  videoEditingDescription: z.string().trim().min(1).max(600),
  cinematographyDescription: z.string().trim().min(1).max(600),
  heroVideoId: z.string().trim().max(128).optional().or(z.literal("")),
  featuredVideoIds: z.array(z.string().trim().min(1).max(128)).max(3),
}).superRefine((value, ctx) => {
  if (new Set(value.featuredVideoIds).size !== value.featuredVideoIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["featuredVideoIds"], message: "Featured videos must be unique." });
  }
});

export type VideoHomepageSettingsValues = z.infer<typeof videoHomepageSettingsSchema>;
