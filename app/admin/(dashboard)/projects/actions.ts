"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/services/auth-service";
import {
  createProject,
  updateProjectMetadata,
  updateProjectContent,
  deleteProject,
  deleteProjects,
} from "@/lib/services/project-admin-service";
import { projectFormSchema } from "@/lib/validations/project";
import { bulkDeleteSchema, deleteIdSchema } from "@/lib/validations/admin";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import { saveEditorContent } from "@/lib/services/content-save-service";
import type { ActionResult, SaveContentPayload, SaveResult, DeleteResult, BulkDeleteResult } from "@/types/admin";

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
    liveSiteUrl: formData.get("liveSiteUrl") ?? "",
    demoUrl: formData.get("demoUrl") ?? "",
    scheduledFor: formData.get("scheduledFor") ?? "",
    templateId: formData.get("templateId") ?? "project-blank",
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
  try {
    await requireAdmin();
  } catch {
    console.error("[admin:project:update] authentication failed", {
      contentType: "project",
      recordId: id,
      operation: "metadata-save",
      validationStage: "authentication",
    });
    return { success: false, code: "AUTH_ERROR", message: "Your admin session expired. Sign in again." };
  }

  const parsed = projectFormSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    console.error("[admin:project:update] validation failed", {
      contentType: "project",
      recordId: id,
      operation: "metadata-save",
      validationStage: "server-zod",
      fields: Object.keys(parsed.error.flatten().fieldErrors),
    });
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateProjectMetadata(id, parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "update", contentType: "project", recordId: id });
  }

  return { success: true, recordId: id, message: "Metadata changes saved." };
}

/** Called from the editor's autosave hook, not a form submit — a much
 *  higher-frequency, narrower write than the metadata action above.
 *  Returns a structured AutosaveResult rather than throwing (see
 *  hooks/use-autosave.ts and docs/PRE_PHASE_6_STABILIZATION_REPORT.md
 *  Workstream A) — a thrown error here used to leave the editor with no
 *  safe, displayable reason for a failed save. */
export async function autosaveProjectContentAction(payload: SaveContentPayload): Promise<SaveResult> {
  return saveEditorContent("project", payload, updateProjectContent);
}

/** Single-record delete. Does not redirect — used from both the edit
 *  page (which navigates away on success) and a management-list row
 *  (which just refreshes in place); see types/admin.ts's DeleteResult. */
export async function deleteProjectAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid project id." };

  try {
    await deleteProject(parsed.data);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, { operation: "delete", contentType: "project", recordId: parsed.data });
  }

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

  return { success: true, deletedCount };
}
