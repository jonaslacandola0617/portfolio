"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { isResumeMediaUrl, upsertSiteSettings } from "@/lib/services/settings-admin-service";
import { settingsFormSchema } from "@/lib/validations/settings";
import type { ActionResult } from "@/types/admin";

export async function updateSettingsAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const learningLabels = formData.getAll("learningLabel").map((value) => String(value));
  const learningHrefs = formData.getAll("learningHref").map((value) => String(value));

  const parsed = settingsFormSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    tagline: formData.get("tagline"),
    email: formData.get("email"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    resumeUrl: formData.get("resumeUrl"),
    currentlyLearning: learningLabels.map((label, index) => ({ label, href: learningHrefs[index] ?? "" })),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  if (!(await isResumeMediaUrl(parsed.data.resumeUrl))) {
    return { success: false, errors: { resumeUrl: ["Select a PDF from the Media Library."] } };
  }

  await upsertSiteSettings(parsed.data);
  return { success: true, message: "Settings saved." };
}
