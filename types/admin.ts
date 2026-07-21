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

export interface DashboardOverview {
  counts: DashboardCounts;
  recentActivity: ActivityItem[];
  /** false when the DB query layer threw — lets the UI degrade gracefully
   *  instead of a hard 500 if Prisma isn't connected yet. */
  dbConnected: boolean;
}

/** Shared return shape for every admin create/update Server Action —
 *  moved here (rather than living in one content type's actions.ts)
 *  once a second content type needed to import it too. */
export interface ActionResult {
  success: boolean;
  errors?: Record<string, string[]>;
  recordId?: string;
}
