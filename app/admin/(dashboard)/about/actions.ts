"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { classifyServiceError } from "@/lib/services/action-errors";
import { replaceAboutProfileImage, upsertAboutPage } from "@/lib/services/about-admin-service";
import { aboutPageSchema, parseNonEmptyLines } from "@/lib/validations/about";
import { profileImageBlobUrlSchema } from "@/lib/validations/url";
import type { ActionResult } from "@/types/admin";

export async function updateAboutAction(
  _previous: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, code: "AUTH_ERROR", message: "Your admin session has expired." };
  }

  const profileImageUrl = String(formData.get("profileImageUrl") ?? "").trim() || null;
  const parsed = aboutPageSchema.safeParse({
    profileImageUrl,
    quote: formData.get("quote"),
    background: formData.get("background"),
    currentFocus: formData.get("currentFocus"),
    focusTags: parseNonEmptyLines(formData.get("focusTags")),
    learningPhilosophy: formData.get("learningPhilosophy"),
    whatsNext: formData.get("whatsNext"),
  });

  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: "Review the About fields and try again.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await upsertAboutPage(parsed.data);
    return { success: true, message: "About page saved and published." };
  } catch (error) {
    const failure = classifyServiceError(error, {
      contentType: "settings",
      operation: "update-about",
      recordId: "singleton",
    });
    return { success: false, code: failure.code, message: failure.message };
  }
}

export async function updateAboutProfileImageAction(
  profileImageUrl: string | null,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, code: "AUTH_ERROR", message: "Your admin session has expired." };
  }

  if (profileImageUrl !== null) {
    const parsed = profileImageBlobUrlSchema.safeParse(profileImageUrl);
    if (!parsed.success) {
      return {
        success: false,
        code: "VALIDATION_ERROR",
        message: "The uploaded profile image must come from the dedicated profile Blob upload.",
      };
    }
    profileImageUrl = parsed.data;
  }

  try {
    await replaceAboutProfileImage(profileImageUrl);
    return { success: true, message: profileImageUrl ? "Profile photo updated." : "Profile photo removed." };
  } catch (error) {
    const failure = classifyServiceError(error, {
      contentType: "settings",
      operation: "update-about-profile-image",
      recordId: "singleton",
    });
    return { success: false, code: failure.code, message: failure.message };
  }
}
