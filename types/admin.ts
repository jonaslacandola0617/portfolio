/** Shared return shape for admin create/update Server Actions. */
export interface ActionResult {
  success: boolean;
  errors?: Record<string, string[]>;
  recordId?: string;
  message?: string;
  code?: string;
}

export interface DeleteResult {
  success: boolean;
  message?: string;
}

export interface BulkDeleteResult {
  success: boolean;
  message?: string;
  deletedCount?: number;
}

export type SaveFailureCode =
  | "SERIALIZATION_ERROR"
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "NOT_FOUND"
  | "DATABASE_ERROR"
  | "CONFLICT"
  | "UNKNOWN_ERROR";

export type SaveResult =
  | { success: true; savedAt: string; revision: number }
  | {
      success: false;
      code: SaveFailureCode;
      message: string;
      revision?: number;
    };

export interface SaveContentPayload {
  id: string;
  content: import("@/types/tiptap").TipTapDoc;
  clientRevision: number;
}

export type DashboardSection<T> = { ok: true; data: T } | { ok: false; message: string };

export interface ContentTypeMetric {
  key: "projects" | "labs" | "articles" | "certificates";
  label: string;
  href: string;
  total: number;
}

export interface RecentlyUpdatedItem {
  id: string;
  type: "PROJECT" | "LAB" | "ARTICLE" | "CERTIFICATE";
  title: string;
  status: string;
  updatedAt: string;
  href: string;
}

export interface DashboardOverview {
  metrics: DashboardSection<ContentTypeMetric[]>;
  recentlyUpdated: DashboardSection<RecentlyUpdatedItem[]>;
}

export type AutosaveResult = SaveResult;
