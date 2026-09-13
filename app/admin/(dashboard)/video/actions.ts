"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { createVideoProject, deleteVideoProject, deleteVideoProjects, reorderVideoProjects, setVideoHomepageFeature, updateVideoHomepageSettings, updateVideoProjectContent, updateVideoProjectMetadata } from "@/lib/services/video-admin-service";
import { saveEditorContent } from "@/lib/services/content-save-service";
import { classifyServiceError, isNextControlFlowError } from "@/lib/services/action-errors";
import { bulkDeleteSchema, deleteIdSchema } from "@/lib/validations/admin";
import { videoHomepageSettingsSchema, videoProjectFormSchema } from "@/lib/validations/video";
import type { ActionResult, BulkDeleteResult, DeleteResult, HomepageShowcaseResult, SaveContentPayload, SaveResult } from "@/types/admin";

function csvValues(value: FormDataEntryValue | null) {
  return typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function parseProjectFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    youtubeUrl: formData.get("youtubeUrl") ?? "",
    disciplines: formData.getAll("disciplines").filter((value): value is string => typeof value === "string"),
    roles: csvValues(formData.get("roles")),
    tools: csvValues(formData.get("tools")),
    client: formData.get("client") ?? "",
    runtime: formData.get("runtime") ?? "",
    customPosterId: formData.get("customPosterId") ?? "",
    completionDate: formData.get("completionDate") ?? "",
    publishStatus: formData.get("publishStatus"),
    scheduledFor: formData.get("scheduledFor") ?? "",
  };
}

export async function createVideoProjectAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = videoProjectFormSchema.safeParse(parseProjectFormData(formData));
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const project = await createVideoProject(parsed.data);
    return {
      success: true,
      recordId: project.id,
      message: "Video project created.",
    };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, {
      operation: "create",
      contentType: "video",
    });
  }
}

export async function updateVideoProjectAction(id: string, _previous: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = videoProjectFormSchema.safeParse(parseProjectFormData(formData));
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateVideoProjectMetadata(id, parsed.data);
    return { success: true, recordId: id, message: "Video metadata saved." };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, {
      operation: "update",
      contentType: "video",
      recordId: id,
    });
  }
}

export async function autosaveVideoContentAction(payload: SaveContentPayload): Promise<SaveResult> {
  return saveEditorContent("video", payload, updateVideoProjectContent);
}

export async function deleteVideoProjectAction(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, message: "Invalid video project id." };
  try {
    await deleteVideoProject(parsed.data);
    return { success: true };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, {
      operation: "delete",
      contentType: "video",
      recordId: parsed.data,
    });
  }
}

export async function bulkDeleteVideoProjectsAction(ids: string[]): Promise<BulkDeleteResult> {
  await requireAdmin();
  const parsed = bulkDeleteSchema.safeParse({ ids });
  if (!parsed.success) return { success: false, message: "Invalid video selection." };
  try {
    const deletedCount = await deleteVideoProjects(parsed.data.ids);
    return { success: true, deletedCount };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return classifyServiceError(error, {
      operation: "bulkDelete",
      contentType: "video",
    });
  }
}

export async function reorderVideoProjectsAction(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = bulkDeleteSchema.safeParse({ ids });
  if (!parsed.success) return { success: false, message: "Invalid video order." };
  try {
    await reorderVideoProjects(parsed.data.ids);
    return { success: true, message: "Video order saved." };
  } catch (error) {
    return classifyServiceError(error, {
      operation: "reorder",
      contentType: "video",
    });
  }
}

export async function toggleFeaturedVideoAction(id: string, showcased: boolean): Promise<HomepageShowcaseResult> {
  await requireAdmin();
  try {
    const result = await setVideoHomepageFeature(id, showcased);
    return result;
  } catch (error) {
    return {
      success: false,
      message: classifyServiceError(error, {
        operation: "feature",
        contentType: "video",
        recordId: id,
      }).message,
    };
  }
}

export async function updateVideoHomepageAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = videoHomepageSettingsSchema.safeParse({
    eyebrow: formData.get("eyebrow"),
    headline: formData.get("headline"),
    intro: formData.get("intro"),
    aboutHeading: formData.get("aboutHeading"),
    aboutBody: formData.get("aboutBody"),
    videoEditingDescription: formData.get("videoEditingDescription"),
    cinematographyDescription: formData.get("cinematographyDescription"),
    heroVideoId: formData.get("heroVideoId") ?? "",
    featuredVideoIds: formData.getAll("featuredVideoIds").filter((value): value is string => typeof value === "string"),
  });
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await updateVideoHomepageSettings(parsed.data);
    return { success: true, message: "Video homepage saved." };
  } catch (error) {
    return classifyServiceError(error, {
      operation: "homepage-save",
      contentType: "video",
    });
  }
}
