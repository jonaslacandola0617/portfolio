"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { classifyServiceError } from "@/lib/services/action-errors";
import { upsertAboutPage } from "@/lib/services/about-admin-service";
import { aboutPageSchema, parseNonEmptyLines } from "@/lib/validations/about";
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
  const parsed = aboutPageSchema.safeParse({
    eyebrow: formData.get("eyebrow"),
    title: formData.get("title"),
    description: formData.get("description"),
    paragraphs: parseNonEmptyLines(formData.get("paragraphs")),
    pillars: [0, 1, 2].map((index) => ({
      icon: formData.get(`pillarIcon${index}`),
      title: formData.get(`pillarTitle${index}`),
      body: formData.get(`pillarBody${index}`),
    })),
    focusLabel: formData.get("focusLabel"),
    currentFocus: parseNonEmptyLines(formData.get("currentFocus")),
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
