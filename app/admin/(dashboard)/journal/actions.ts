"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { requireAdmin } from "@/lib/services/auth-service";
import { createArticle, updateArticleMetadata, updateArticleContent, deleteArticle } from "@/lib/services/article-admin-service";
import { articleFormSchema, articleContentSchema } from "@/lib/validations/article";
import type { ActionResult } from "@/types/admin";

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
  const article = await createArticle(parsed.data);
  redirect(`/admin/journal/${article.id}`);
}

export async function updateArticleAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = articleFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  await updateArticleMetadata(id, parsed.data);
  revalidatePath(`/admin/journal/${id}`);
  return { success: true, recordId: id };
}

export async function autosaveArticleContentAction(id: string, content: JSONContent) {
  await requireAdmin();
  const parsed = articleContentSchema.safeParse(content);
  if (!parsed.success) throw new Error(`Invalid content: ${parsed.error.message}`);
  await updateArticleContent(id, parsed.data as JSONContent);
}

export async function deleteArticleAction(id: string) {
  await requireAdmin();
  await deleteArticle(id);
  revalidatePath("/admin/journal");
  redirect("/admin/journal");
}
