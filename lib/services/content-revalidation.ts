import "server-only";

import { revalidatePath } from "next/cache";
import {
  getRevalidationTargets,
  type RevalidationContentType,
} from "@/lib/revalidation-targets";

export type { RevalidationContentType } from "@/lib/revalidation-targets";

export function revalidateContent(
  contentType: RevalidationContentType,
  slugs: string[] = []
): void {
  for (const target of getRevalidationTargets(contentType, slugs)) {
    if (target.type) revalidatePath(target.path, target.type);
    else revalidatePath(target.path);
  }
}
