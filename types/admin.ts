/**
 * Shape a future ActivityLog table will satisfy. Defined now so the
 * dashboard, the query layer, and the eventual Prisma model all agree on
 * one contract — adding the real table later is additive, not a rework.
 */
export interface ActivityItem {
  id: string;
  action: "created" | "updated" | "published" | "archived" | "deleted";
  contentType: "project" | "lab" | "article" | "certificate" | "timeline" | "media";
  contentTitle: string;
  actor: string; // admin email/name at time of action
  createdAt: string;
}

export interface DashboardCounts {
  projects: number;
  labs: number;
  articles: number;
  certificates: number;
}

export interface LegacyDashboardOverview {
  counts: DashboardCounts;
  recentActivity: ActivityItem[];
  /** false when the DB query layer threw — lets the UI degrade gracefully
   *  instead of a hard 500 if Prisma isn't connected yet. */
  dbConnected: boolean;
}

/** Shared return shape for every admin create/update Server Action —
 *  moved here (rather than living in one content type's actions.ts)
 *  once a second content type needed to import it too.
 *
 *  `message`/`code` added during the pre-Phase-6 stabilization pass —
 *  before this, a create/update failure that wasn't a Zod field error
 *  (a duplicate slug, a dropped DB connection, a deleted-out-from-under
 *  record) just threw, producing Next.js's generic unhandled-error
 *  overlay instead of a message the form could show next to Save. */
export interface ActionResult {
  success: boolean;
  errors?: Record<string, string[]>;
  recordId?: string;
  message?: string;
  code?: string;
}

/** Return shape for a single-record delete Server Action. Deliberately
 *  does NOT redirect internally (the old delete actions did) — the same
 *  action is now called from both the edit page (which should navigate
 *  away on success) and a management-list row (which should just
 *  refresh in place), so navigation is the caller's decision, not the
 *  action's. */
export interface DeleteResult {
  success: boolean;
  message?: string;
}

/** Return shape for a bulk-delete Server Action (management pages'
 *  "Delete selected"). */
export interface BulkDeleteResult {
  success: boolean;
  message?: string;
  deletedCount?: number;
}

/** Return shape for the editor's autosave Server Actions. Replaces the
 *  previous throw-only design (see docs/PRE_PHASE_6_STABILIZATION_REPORT.md
 *  Workstream A) — a rejected Promise carried no safe, displayable reason,
 *  and in production Next.js redacts Server Action error messages by
 *  default, so the client had nothing useful to show even before that. */
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

/** The only non-FormData payload accepted by long-form content actions. */
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

/** Kept as a compatibility alias for callers outside the editor. */
export type AutosaveResult = SaveResult;
