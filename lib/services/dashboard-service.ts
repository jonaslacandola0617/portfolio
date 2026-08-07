import "server-only";

import { prisma } from "@/lib/db";
import type {
  ContentTypeMetric,
  DashboardOverview,
  DashboardSection,
  RecentlyUpdatedItem,
} from "@/types/admin";

function failed<T>(section: string, error: unknown): DashboardSection<T> {
  console.error("[dashboard]", {
    operation: "load",
    section,
    errorType: error instanceof Error ? error.name : "UnknownError",
  });
  return { ok: false, message: "This dashboard section could not be loaded." };
}

async function getMetrics(): Promise<ContentTypeMetric[]> {
  const [projects, labs, articles, certificates] = await Promise.all([
    prisma.project.count(),
    prisma.lab.count(),
    prisma.article.count(),
    prisma.certificate.count(),
  ]);
  return [
    { key: "projects", label: "Projects", href: "/admin/projects", total: projects },
    { key: "labs", label: "Labs", href: "/admin/labs", total: labs },
    { key: "articles", label: "Articles", href: "/admin/journal", total: articles },
    { key: "certificates", label: "Certificates", href: "/admin/certificates", total: certificates },
  ];
}

async function getRecentlyUpdated(): Promise<RecentlyUpdatedItem[]> {
  const select = { id: true, title: true, publishStatus: true, updatedAt: true } as const;
  const [projects, labs, articles, certificates] = await Promise.all([
    prisma.project.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select }),
    prisma.lab.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select }),
    prisma.article.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select }),
    prisma.certificate.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, name: true, publishStatus: true, updatedAt: true },
    }),
  ]);
  return [
    ...projects.map((item) => ({ id: item.id, type: "PROJECT" as const, title: item.title, status: item.publishStatus, updatedAt: item.updatedAt.toISOString(), href: `/admin/projects/${item.id}` })),
    ...labs.map((item) => ({ id: item.id, type: "LAB" as const, title: item.title, status: item.publishStatus, updatedAt: item.updatedAt.toISOString(), href: `/admin/labs/${item.id}` })),
    ...articles.map((item) => ({ id: item.id, type: "ARTICLE" as const, title: item.title, status: item.publishStatus, updatedAt: item.updatedAt.toISOString(), href: `/admin/journal/${item.id}` })),
    ...certificates.map((item) => ({ id: item.id, type: "CERTIFICATE" as const, title: item.name, status: item.publishStatus, updatedAt: item.updatedAt.toISOString(), href: `/admin/certificates/${item.id}` })),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 8);
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [metrics, recentlyUpdated] = await Promise.allSettled([getMetrics(), getRecentlyUpdated()]);
  const section = <T>(result: PromiseSettledResult<T>, name: string): DashboardSection<T> =>
    result.status === "fulfilled" ? { ok: true, data: result.value } : failed<T>(name, result.reason);
  return {
    metrics: section(metrics, "metrics"),
    recentlyUpdated: section(recentlyUpdated, "recent-activity"),
  };
}
