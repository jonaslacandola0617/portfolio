import "server-only";
import type { ActivityItem } from "@/types/admin";

/**
 * Reserved architecture, not yet implemented (per the architecture
 * review — no ActivityLog table exists in schema.prisma yet). Returns an
 * empty list so the dashboard's "Recent Activity" panel already has a
 * real, typed data source.
 *
 * When ActivityLog lands (a table with the same shape as ActivityItem,
 * written to by each admin Server Action after a mutation), this
 * function's body becomes a real query — `prisma.activityLog.findMany()`
 * — and nothing above it (service, dashboard page, component) changes.
 */
export async function getRecentActivity(): Promise<ActivityItem[]> {
  return [];
}
