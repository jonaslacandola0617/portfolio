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
  const published = { where: { publishStatus: "PUBLISHED" as const } };
  const [labs, labsLive, projects, projectsLive, certificates, certificatesLive, articles, articlesLive] = await Promise.all([
    prisma.lab.count(), prisma.lab.count(published),
    prisma.project.count(), prisma.project.count(published),
    prisma.certificate.count(), prisma.certificate.count(published),
    prisma.article.count(), prisma.article.count(published),
  ]);
  return [
    { key: "labs", label: "Labs", href: "/admin/labs", total: labs, published: labsLive },
    { key: "projects", label: "Projects", href: "/admin/projects", total: projects, published: projectsLive },
    { key: "certificates", label: "Certificates", href: "/admin/certificates", total: certificates, published: certificatesLive },
    { key: "articles", label: "Writing", href: "/admin/journal", total: articles, published: articlesLive },
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
