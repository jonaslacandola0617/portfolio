import "server-only";

import { requireAdmin } from "@/lib/services/auth-service";
import { classifyServiceError } from "@/lib/services/action-errors";
import { saveContentPayloadSchema } from "@/lib/validations/content";
import { diagnoseTipTapDocument } from "@/lib/content-diagnostics";
import type { SaveContentPayload, SaveResult } from "@/types/admin";
import type { TipTapDoc } from "@/types/tiptap";

type ContentType = "project" | "lab" | "article" | "certificate";

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
    .join(",")}}`;
}

export async function saveEditorContent(
  contentType: ContentType,
  input: SaveContentPayload,
  persist: (id: string, content: TipTapDoc) => Promise<unknown>
): Promise<SaveResult> {
  try {
    await requireAdmin();
  } catch (error) {
    console.error(`[admin:${contentType}:autosave] authentication failed`, {
      contentType,
      recordId: typeof input?.id === "string" ? input.id : undefined,
      operation: "autosave",
      validationStage: "authentication",
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return {
      success: false,
      code: "AUTH_ERROR",
      message: "Your admin session has expired. Sign in again before saving.",
      revision: input?.clientRevision,
    };
  }

  const parsed = saveContentPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const diagnostic = diagnoseTipTapDocument(input?.content, parsed.error);
    console.error(`[admin:${contentType}:autosave] validation failed`, {
      contentType,
      recordId: typeof input?.id === "string" ? input.id : undefined,
      operation: "autosave",
      validationStage: "server-zod",
      path: diagnostic.path,
      nodeType: diagnostic.nodeType,
      reason: diagnostic.reason,
    });
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: `The editor content is invalid at ${diagnostic.path}: ${diagnostic.reason}.`,
      revision: input?.clientRevision,
    };
  }

  let persisted: unknown;
  try {
    persisted = await persist(parsed.data.id, parsed.data.content as TipTapDoc);
  } catch (error) {
    const classified = classifyServiceError(error, {
      operation: "autosave",
      contentType,
      recordId: parsed.data.id,
    });
    return {
      success: false,
      code:
        classified.code === "NOT_FOUND"
          ? "NOT_FOUND"
          : classified.code === "DB_UNAVAILABLE"
            ? "DATABASE_ERROR"
            : "UNKNOWN_ERROR",
      message: classified.message,
      revision: parsed.data.clientRevision,
    };
  }

  if (canonicalJson(persisted) !== canonicalJson(parsed.data.content)) {
    console.error(`[admin:${contentType}:autosave] database read-back mismatch`, {
      contentType,
      recordId: parsed.data.id,
      operation: "autosave",
      validationStage: "database-readback",
      revision: parsed.data.clientRevision,
    });
    return {
      success: false,
      code: "CONFLICT",
      message: "The database did not confirm the same editor revision. Retry the save.",
      revision: parsed.data.clientRevision,
    };
  }

  return {
    success: true,
    savedAt: new Date().toISOString(),
    revision: parsed.data.clientRevision,
  };
}
