"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/services/auth-service";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { githubOwnerFromUrl } from "@/lib/github/project-sync";
import {
  importGitHubRepository,
  syncGitHubProject,
} from "@/lib/services/github-project-sync-service";

export interface GitHubProjectActionResult {
  success: boolean;
  message: string;
  projectId?: string;
}

export async function importGitHubRepositoryAction(fullName: string): Promise<GitHubProjectActionResult> {
  await requireAdmin();

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) {
    return { success: false, message: "Invalid GitHub repository." };
  }

  try {
    const result = await importGitHubRepository(fullName);
    revalidatePath("/admin/projects");
    return {
      success: true,
      message: result.message,
      projectId: result.projectId,
    };
  } catch (error) {
    console.error("[github-project-sync] import failed", { fullName, error });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Could not import this GitHub repository.",
    };
  }
}

export async function syncGitHubProjectAction(projectId: string): Promise<GitHubProjectActionResult> {
  await requireAdmin();

  if (!projectId || projectId.length > 128) {
    return { success: false, message: "Invalid project." };
  }

  try {
    const result = await syncGitHubProject(projectId);
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true, message: result.message, projectId: result.projectId };
  } catch (error) {
    console.error("[github-project-sync] sync failed", { projectId, error });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Could not sync this project from GitHub.",
    };
  }
}

export async function getConfiguredGitHubOwnerAction(): Promise<GitHubProjectActionResult> {
  await requireAdmin();
  const settings = await getSiteSettings();
  const owner = githubOwnerFromUrl(settings.githubUrl);
  if (!owner) {
    return { success: false, message: "Add your GitHub profile URL in Site Settings first." };
  }
  return { success: true, message: owner };
}
