import { getProjectCount } from "@/lib/db/queries/projects";
import { getLabCount } from "@/lib/db/queries/labs";
import { getArticleCount } from "@/lib/db/queries/articles";
import { getCertificateCount } from "@/lib/db/queries/certificates";
import { getRecentActivity } from "@/lib/db/queries/activity";
import type { DashboardOverview } from "@/types/admin";

/**
 * Services orchestrate one or more queries into the shape a page actually
 * needs — that orchestration is "business logic" and belongs here, not
 * inlined in app/admin/(dashboard)/page.tsx.
 *
 * Wrapped in try/catch deliberately: if Prisma isn't connected yet (real
 * case right now — Neon migration hasn't run in every environment this
 * runs in), the dashboard should render a clear zero-state, not crash the
 * whole admin shell. `dbConnected: false` lets the page distinguish
 * "genuinely zero content" from "couldn't reach the database."
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  try {
    const [projects, labs, articles, certificates, recentActivity] = await Promise.all([
      getProjectCount(),
      getLabCount(),
      getArticleCount(),
      getCertificateCount(),
      getRecentActivity(),
    ]);

    return {
      counts: { projects, labs, articles, certificates },
      recentActivity,
      dbConnected: true,
    };
  } catch (error) {
    console.error("[dashboard-service] Database unavailable, showing empty state:", error);
    return {
      counts: { projects: 0, labs: 0, articles: 0, certificates: 0 },
      recentActivity: [],
      dbConnected: false,
    };
  }
}
