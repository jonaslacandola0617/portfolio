"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { upsertSiteSettings } from "@/lib/services/settings-admin-service";
import { settingsFormSchema, parseLearningLines } from "@/lib/validations/settings";
import type { ActionResult } from "@/types/admin";

export async function updateSettingsAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = settingsFormSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    tagline: formData.get("tagline"),
    email: formData.get("email"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    resumeUrl: formData.get("resumeUrl"),
    currentlyLearning: parseLearningLines((formData.get("currentlyLearning") as string) ?? ""),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await upsertSiteSettings(parsed.data);
  return { success: true };
}
