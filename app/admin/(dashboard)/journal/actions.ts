"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { requireAdmin } from "@/lib/services/auth-service";
import {
  createArticle,
  updateArticleMetadata,
  updateArticleContent,
  deleteArticle,
  deleteArticles,
} from "@/lib/services/article-admin-service";
import { articleFormSchema, articleContentSchema } from "@/lib/validations/article";
import { bulkDeleteSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import type { ActionResult, AutosaveResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

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
  await requireAdmin();
  const parsed = articleFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await updateArticleMetadata(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "article", recordId: id });
  }

  revalidatePath(`/admin/journal/${id}`);
  return { success: true, recordId: id, message: "Changes saved." };
}

export async function autosaveArticleContentAction(id: string, content: JSONContent): Promise<AutosaveResult> {
  await requireAdmin();
  const parsed = articleContentSchema.safeParse(content);
  if (!parsed.success) {
    console.error("[admin:article:autosave] content failed validation", { recordId: id, issues: parsed.error.issues });
    return {
      success: false,
      message: "This content couldn't be saved — it contains something the editor doesn't recognize.",
      code: "INVALID_CONTENT",
    };
  }

  try {
    await updateArticleContent(id, parsed.data as JSONContent);
  } catch (error) {
    const result = classifyServiceError(error, { operation: "autosave", contentType: "article", recordId: id });
    return { success: false, message: result.message, code: result.code };
  }

  return { success: true, savedAt: new Date().toISOString() };
}

export async function deleteArticleAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  try {
    await deleteArticle(id);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "article", recordId: id });
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
