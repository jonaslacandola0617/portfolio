"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { upsertSiteSettings } from "@/lib/services/settings-admin-service";
import { settingsFormSchema, parseLearningLines } from "@/lib/validations/settings";
import type { ActionResult } from "@/types/admin";

export async function updateSettingsAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const primaryProjectId = typeof formData.get("homepagePrimaryProjectId") === "string"
    ? String(formData.get("homepagePrimaryProjectId")).trim()
    : "";
  const secondaryProjectId = typeof formData.get("homepageSecondaryProjectId") === "string"
    ? String(formData.get("homepageSecondaryProjectId")).trim()
    : "";

  const homepageProjectIds = secondaryProjectId
    ? [primaryProjectId, secondaryProjectId]
    : primaryProjectId
      ? [primaryProjectId]
      : [];

  const parsed = settingsFormSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    tagline: formData.get("tagline"),
    email: formData.get("email"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    resumeUrl: formData.get("resumeUrl"),
    currentlyLearning: parseLearningLines((formData.get("currentlyLearning") as string) ?? ""),
    homepageProjectIds,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await upsertSiteSettings(parsed.data);
  return { success: true, message: "Settings saved." };
}
