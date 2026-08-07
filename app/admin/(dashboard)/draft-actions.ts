"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/auth-service";
import { createDraftFromTemplate } from "@/lib/services/draft-admin-service";
import type { TemplateContentType } from "@/lib/editor/templates";

export interface CreateDraftState {
  success: boolean;
  message?: string;
}

const editorPath: Record<TemplateContentType, string> = {
  project: "/admin/projects",
  lab: "/admin/labs",
  article: "/admin/journal",
};

export async function createDraftFromTemplateAction(
  _previous: CreateDraftState,
  formData: FormData,
): Promise<CreateDraftState> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, message: "Your admin session expired. Sign in again." };
  }

  const contentType = String(formData.get("contentType") ?? "") as TemplateContentType;
  const templateId = String(formData.get("templateId") ?? "");

  if (!(["project", "lab", "article"] as string[]).includes(contentType)) {
    return { success: false, message: "Invalid content type." };
  }

  try {
    const draft = await createDraftFromTemplate(contentType, templateId);
    redirect(`${editorPath[contentType]}/${draft.id}?created=1`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return {
      success: false,
      message: error instanceof Error ? error.message.replace(/^VALIDATION:\s*/, "") : "Could not create the draft.",
    };
  }
}
