"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { updateHomepageProjectIds } from "@/lib/services/settings-admin-service";
import type { ActionResult } from "@/types/admin";

export async function updateHomepageShowcaseAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const primary = typeof formData.get("primaryProjectId") === "string"
    ? String(formData.get("primaryProjectId")).trim()
    : "";
  const secondary = typeof formData.get("secondaryProjectId") === "string"
    ? String(formData.get("secondaryProjectId")).trim()
    : "";

  const ids = [primary, secondary].filter(Boolean);

  try {
    await updateHomepageProjectIds(ids);
    return { success: true, message: "Homepage showcase updated." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "The homepage showcase could not be updated.",
    };
  }
}
