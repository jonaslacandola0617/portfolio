"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { saveHomepageContent } from "@/lib/services/homepage-admin-service";
import { homepageSchema } from "@/lib/validations/homepage";

export type HomepageActionState = {
  status: "idle" | "saved" | "invalid" | "error";
  message?: string;
  /** Field errors keyed by dotted path, e.g. "experience.0.title". */
  fieldErrors?: Record<string, string>;
  savedAt?: number;
};

export async function saveHomepageAction(_prev: HomepageActionState, formData: FormData): Promise<HomepageActionState> {
  await requireAdmin();

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { status: "error", message: "The form data couldn't be read. Reload the page and try again." };
  }

  const parsed = homepageSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    const count = Object.keys(fieldErrors).length;
    return { status: "invalid", message: `${count} field${count === 1 ? " needs" : "s need"} attention before saving.`, fieldErrors };
  }

  try {
    await saveHomepageContent(parsed.data);
  } catch {
    return { status: "error", message: "Saving failed. Your changes are still here; try again in a moment." };
  }
  return { status: "saved", message: "Homepage saved. The public site is updated.", savedAt: Date.now() };
}
