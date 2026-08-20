import { z } from "zod";

export const articleResourcesPayloadSchema = z.object({
  articleId: z.string().min(1).max(128),
  resources: z.array(z.object({
    mediaId: z.string().min(1).max(128),
    label: z.string().trim().min(1).max(200),
    description: z.string().trim().max(500),
    sortOrder: z.number().int().min(0).max(100),
  })).max(30),
});

export type ArticleResourcesPayload = z.infer<typeof articleResourcesPayloadSchema>;
