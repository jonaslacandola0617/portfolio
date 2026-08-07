import { z } from "zod";

export const taxonomySearchSchema = z.object({
  kind: z.enum(["category", "tag", "skill"]),
  query: z.string().trim().max(80),
  limit: z.number().int().min(1).max(20).default(8),
});

export type TaxonomyKind = z.infer<typeof taxonomySearchSchema>["kind"];

export interface TaxonomySuggestion {
  id: string;
  name: string;
  detail?: string;
}
