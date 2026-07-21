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
} from "@/lib/services/project-admin-service";
import { projectFormSchema, projectContentSchema } from "@/lib/validations/project";
import type { ActionResult } from "@/types/admin";

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

  const project = await createProject(parsed.data);
  redirect(`/admin/projects/${project.id}`);
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

  await updateProjectMetadata(id, parsed.data);
  revalidatePath(`/admin/projects/${id}`);
  return { success: true, recordId: id };
}

/** Called from the editor's autosave hook, not a form submit — a much
 *  higher-frequency, narrower write than the metadata action above. */
export async function autosaveProjectContentAction(id: string, content: JSONContent) {
  await requireAdmin();

  const parsed = projectContentSchema.safeParse(content);
  if (!parsed.success) {
    throw new Error(`Invalid content: ${parsed.error.message}`);
  }

  await updateProjectContent(id, parsed.data as JSONContent);
}

export async function deleteProjectAction(id: string) {
  await requireAdmin();
  await deleteProject(id);
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}
