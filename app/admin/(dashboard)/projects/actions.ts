"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { requireAdmin } from "@/lib/services/auth-service";
import {
  createProject,
  updateProjectMetadata,
  updateProjectContent,
  deleteProject,
  deleteProjects,
} from "@/lib/services/project-admin-service";
import { projectFormSchema, projectContentSchema } from "@/lib/validations/project";
import { bulkDeleteSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import type { ActionResult, AutosaveResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

export type { ActionResult };

/**
 * Every action here calls requireAdmin() itself, even though
 * middleware.ts already blocks unauthenticated requests to /admin/*.
 * Server Actions are callable RPC-style endpoints Next.js exposes
 * directly — middleware's path matching protects the *page* that
 * renders the trigger, not a guarantee about how the action itself gets
 * invoked. Same defense-in-depth reasoning as
 * app/admin/(dashboard)/layout.tsx calling requireAdmin() a second time
 * on top of middleware (see ARCHITECTURE.md §3).
 */

function parseFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    category: formData.get("category"),
    difficulty: formData.get("difficulty"),
    progressStatus: formData.get("progressStatus"),
    publishStatus: formData.get("publishStatus"),
    tags: (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
    skills: (formData.get("skills") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
    technologies:
      (formData.get("technologies") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
    estimatedTime: formData.get("estimatedTime") ?? "",
    completionDate: formData.get("completionDate"),
    githubUrl: formData.get("githubUrl") ?? "",
    scheduledFor: formData.get("scheduledFor") ?? "",
  };
}

export async function createProjectAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = projectFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  let project;
  try {
    project = await createProject(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "create", contentType: "project" });
  }
  redirect(`/admin/projects/${project.id}?created=1`);
}

export async function updateProjectAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = projectFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateProjectMetadata(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "project", recordId: id });
  }

  revalidatePath(`/admin/projects/${id}`);
  return { success: true, recordId: id, message: "Changes saved." };
}

/** Called from the editor's autosave hook, not a form submit — a much
 *  higher-frequency, narrower write than the metadata action above.
 *  Returns a structured AutosaveResult rather than throwing (see
 *  hooks/use-autosave.ts and docs/PRE_PHASE_6_STABILIZATION_REPORT.md
 *  Workstream A) — a thrown error here used to leave the editor with no
 *  safe, displayable reason for a failed save. */
export async function autosaveProjectContentAction(id: string, content: JSONContent): Promise<AutosaveResult> {
  await requireAdmin();

  const parsed = projectContentSchema.safeParse(content);
  if (!parsed.success) {
    console.error("[admin:project:autosave] content failed validation", {
      recordId: id,
      issues: parsed.error.issues,
    });
    return {
      success: false,
      message: "This content couldn't be saved — it contains something the editor doesn't recognize.",
      code: "INVALID_CONTENT",
    };
  }

  try {
    await updateProjectContent(id, parsed.data as JSONContent);
  } catch (error) {
    const result = classifyServiceError(error, { operation: "autosave", contentType: "project", recordId: id });
    return { success: false, message: result.message, code: result.code };
  }

  return { success: true, savedAt: new Date().toISOString() };
}

/** Single-record delete. Does not redirect — used from both the edit
 *  page (which navigates away on success) and a management-list row
 *  (which just refreshes in place); see types/admin.ts's DeleteResult. */
export async function deleteProjectAction(id: string): Promise<DeleteResult> {
  await requireAdmin();

  try {
    await deleteProject(id);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "project", recordId: id });
  }

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}

export async function bulkDeleteProjectsAction(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin();

  const parsed = bulkDeleteSchema.safeParse({ ids });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid selection." };
  }

  let deletedCount: number;
  try {
    deletedCount = await deleteProjects(parsed.data.ids);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "bulkDelete", contentType: "project" });
  }

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true, deletedCount };
}
