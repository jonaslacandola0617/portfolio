"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { searchTaxonomy } from "@/lib/services/taxonomy-admin-service";
import { taxonomySearchSchema, type TaxonomySuggestion } from "@/lib/validations/taxonomy";

export type TaxonomySearchResult =
  | { success: true; items: TaxonomySuggestion[] }
  | { success: false; message: string };

export async function searchTaxonomyAction(input: unknown): Promise<TaxonomySearchResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, message: "Your admin session has expired." };
  }
  const parsed = taxonomySearchSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Invalid taxonomy search." };
  try {
    return {
      success: true,
      items: await searchTaxonomy(parsed.data.kind, parsed.data.query, parsed.data.limit),
    };
  } catch (error) {
    console.error("[admin:taxonomy:search] query failed", {
      operation: "suggest",
      contentType: parsed.data.kind,
      validationStage: "database-read",
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return { success: false, message: "Suggestions are temporarily unavailable." };
  }
}
