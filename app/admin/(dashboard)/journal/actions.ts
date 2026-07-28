"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/auth-service";
import {
  createArticle,
  updateArticleMetadata,
  updateArticleContent,
  deleteArticle,
  deleteArticles,
} from "@/lib/services/article-admin-service";
import { articleFormSchema } from "@/lib/validations/article";
import { bulkDeleteSchema, deleteIdSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import { saveEditorContent } from "@/lib/services/content-save-service";
import type { ActionResult, SaveContentPayload, SaveResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

function parseFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    category: formData.get("category"),
    publishStatus: formData.get("publishStatus"),
    tags: (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
    date: formData.get("date"),
    scheduledFor: formData.get("scheduledFor") ?? "",
  };
}

export async function createArticleAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = articleFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  let article;
  try {
    article = await createArticle(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "create", contentType: "article" });
  }
  redirect(`/admin/journal/${article.id}?created=1`);
}

export async function updateArticleAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    console.error("[admin:article:update] authentication failed", {
      contentType: "article",
      recordId: id,
      operation: "metadata-save",
      validationStage: "authentication",
    });
    return { success: false, code: "AUTH_ERROR", message: "Your admin session expired. Sign in again." };
  }
  const parsed = articleFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    console.error("[admin:article:update] validation failed", {
      contentType: "article",
      recordId: id,
      operation: "metadata-save",
      validationStage: "server-zod",
      fields: Object.keys(parsed.error.flatten().fieldErrors),
    });
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateArticleMetadata(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "article", recordId: id });
  }

  return { success: true, recordId: id, message: "Metadata changes saved." };
}

export async function autosaveArticleContentAction(payload: SaveContentPayload): Promise<SaveResult> {
  return saveEditorContent("article", payload, updateArticleContent);
}

export async function deleteArticleAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid article id." };
  try {
    await deleteArticle(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "article", recordId: parsed.data });
  }
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath("/");
  return { success: true };
}

export async function bulkDeleteArticlesAction(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin();
  const parsed = bulkDeleteSchema.safeParse({ ids });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid selection." };

  let deletedCount: number;
  try {
    deletedCount = await deleteArticles(parsed.data.ids);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "bulkDelete", contentType: "article" });
  }

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath("/");
  return { success: true, deletedCount };
}
