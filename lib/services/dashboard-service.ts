import "server-only";

import { prisma } from "@/lib/db";
import type {
  AttentionItem,
  ContentTypeMetric,
  DashboardOverview,
  DashboardSection,
  PublicationStatusTotals,
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
  const [
    projects, projectPublished, projectDraft, projectInProgress,
    labs, labPublished, labDraft, labInProgress,
    articles, articlePublished, articleDraft, articleArchived,
    certificates, certificatePublished, certificateInProgress, certificateCompleted,
    timeline, timelinePublished, timelineDraft, latestTimeline,
    skills, skillGroups, advancedSkills,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.project.count({ where: { publishStatus: "DRAFT" } }),
    prisma.project.count({ where: { progressStatus: "IN_PROGRESS" } }),
    prisma.lab.count(),
    prisma.lab.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.lab.count({ where: { publishStatus: "DRAFT" } }),
    prisma.lab.count({ where: { progressStatus: "IN_PROGRESS" } }),
    prisma.article.count(),
    prisma.article.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.article.count({ where: { publishStatus: "DRAFT" } }),
    prisma.article.count({ where: { publishStatus: "ARCHIVED" } }),
    prisma.certificate.count(),
    prisma.certificate.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.certificate.count({ where: { progressStatus: "IN_PROGRESS" } }),
    prisma.certificate.count({ where: { progressStatus: "COMPLETED" } }),
    prisma.timelineEntry.count(),
    prisma.timelineEntry.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.timelineEntry.count({ where: { publishStatus: "DRAFT" } }),
    prisma.timelineEntry.findFirst({ orderBy: { date: "desc" }, select: { date: true } }),
    prisma.skill.count(),
    prisma.skill.groupBy({ by: ["group"], _count: { _all: true }, orderBy: { _count: { group: "desc" } } }),
    prisma.skill.count({ where: { level: "comfortable" } }),
  ]);
  const largestGroup = skillGroups[0];
  return [
    { key: "projects", label: "Projects", href: "/admin/projects", total: projects, details: [{ label: "Published", value: projectPublished }, { label: "Draft", value: projectDraft }, { label: "In progress", value: projectInProgress }] },
    { key: "labs", label: "Labs", href: "/admin/labs", total: labs, details: [{ label: "Published", value: labPublished }, { label: "Draft", value: labDraft }, { label: "In progress", value: labInProgress }] },
    { key: "articles", label: "Articles", href: "/admin/journal", total: articles, details: [{ label: "Published", value: articlePublished }, { label: "Draft", value: articleDraft }, { label: "Archived", value: articleArchived }] },
    { key: "certificates", label: "Certificates", href: "/admin/certificates", total: certificates, details: [{ label: "Published", value: certificatePublished }, { label: "In progress", value: certificateInProgress }, { label: "Completed", value: certificateCompleted }] },
    { key: "timeline", label: "Timeline Entries", href: "/admin/timeline", total: timeline, details: [{ label: "Published", value: timelinePublished }, { label: "Draft", value: timelineDraft }, { label: "Latest entry", value: latestTimeline ? latestTimeline.date.toLocaleDateString("en", { month: "short", year: "numeric" }) : "—" }] },
    { key: "skills", label: "Skills", href: "/admin/skills", total: skills, details: [{ label: "Groups", value: skillGroups.length }, { label: "Advanced", value: advancedSkills }, { label: "Largest group", value: largestGroup ? `${largestGroup.group} (${largestGroup._count._all})` : "—" }] },
  ];
}

async function getPublicationTotals(): Promise<PublicationStatusTotals> {
  const results = await Promise.all([
    prisma.project.groupBy({ by: ["publishStatus"], _count: { _all: true } }),
    prisma.lab.groupBy({ by: ["publishStatus"], _count: { _all: true } }),
    prisma.article.groupBy({ by: ["publishStatus"], _count: { _all: true } }),
    prisma.certificate.groupBy({ by: ["publishStatus"], _count: { _all: true } }),
    prisma.timelineEntry.groupBy({ by: ["publishStatus"], _count: { _all: true } }),
  ]);
  const totals: PublicationStatusTotals = { PUBLISHED: 0, DRAFT: 0, SCHEDULED: 0, ARCHIVED: 0 };
  for (const groups of results) {
    for (const group of groups) totals[group.publishStatus] += group._count._all;
  }
  return totals;
}

async function getRecentlyUpdated(): Promise<RecentlyUpdatedItem[]> {
  const select = { id: true, title: true, publishStatus: true, updatedAt: true } as const;
  const [projects, labs, articles, certificates] = await Promise.all([
    prisma.project.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select }),
    prisma.lab.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select }),
    prisma.article.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select }),
    prisma.certificate.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select: { id: true, name: true, publishStatus: true, updatedAt: true } }),
  ]);
  return [
    ...projects.map((x) => ({ id: x.id, type: "PROJECT" as const, title: x.title, status: x.publishStatus, updatedAt: x.updatedAt.toISOString(), href: `/admin/projects/${x.id}` })),
    ...labs.map((x) => ({ id: x.id, type: "LAB" as const, title: x.title, status: x.publishStatus, updatedAt: x.updatedAt.toISOString(), href: `/admin/labs/${x.id}` })),
    ...articles.map((x) => ({ id: x.id, type: "ARTICLE" as const, title: x.title, status: x.publishStatus, updatedAt: x.updatedAt.toISOString(), href: `/admin/journal/${x.id}` })),
    ...certificates.map((x) => ({ id: x.id, type: "CERTIFICATE" as const, title: x.name, status: x.publishStatus, updatedAt: x.updatedAt.toISOString(), href: `/admin/certificates/${x.id}` })),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);
}

async function getAttentionItems(): Promise<AttentionItem[]> {
  const staleBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [staleDrafts, noThumb, noProjectTags, noLabTags, noArticleTags, scheduled, noCredential] = await Promise.all([
    Promise.all([
      prisma.project.count({ where: { publishStatus: "DRAFT", updatedAt: { lt: staleBefore } } }),
      prisma.lab.count({ where: { publishStatus: "DRAFT", updatedAt: { lt: staleBefore } } }),
      prisma.article.count({ where: { publishStatus: "DRAFT", updatedAt: { lt: staleBefore } } }),
      prisma.certificate.count({ where: { publishStatus: "DRAFT", updatedAt: { lt: staleBefore } } }),
    ]).then((x) => x.reduce((a, b) => a + b, 0)),
    prisma.project.count({ where: { publishStatus: "PUBLISHED", thumbnailId: null } }),
    prisma.project.count({ where: { publishStatus: "PUBLISHED", tags: { none: {} } } }),
    prisma.lab.count({ where: { publishStatus: "PUBLISHED", tags: { none: {} } } }),
    prisma.article.count({ where: { publishStatus: "PUBLISHED", tags: { none: {} } } }),
    Promise.all([
      prisma.project.count({ where: { publishStatus: "SCHEDULED" } }),
      prisma.lab.count({ where: { publishStatus: "SCHEDULED" } }),
      prisma.article.count({ where: { publishStatus: "SCHEDULED" } }),
      prisma.certificate.count({ where: { publishStatus: "SCHEDULED" } }),
      prisma.timelineEntry.count({ where: { publishStatus: "SCHEDULED" } }),
    ]).then((x) => x.reduce((a, b) => a + b, 0)),
    prisma.certificate.count({ where: { publishStatus: "PUBLISHED", progressStatus: "COMPLETED", credentialUrl: null } }),
  ]);
  return [
    { id: "stale-drafts", count: staleDrafts, label: "Stale drafts", detail: "Drafts unchanged for more than 30 days.", href: "/admin/projects", severity: "warning" as const },
    { id: "project-thumbnails", count: noThumb, label: "Projects without thumbnails", detail: "Published projects missing a visual preview.", href: "/admin/projects", severity: "warning" as const },
    { id: "project-tags", count: noProjectTags, label: "Untagged projects", detail: "Published projects with no searchable tags.", href: "/admin/projects", severity: "info" as const },
    { id: "lab-tags", count: noLabTags, label: "Untagged labs", detail: "Published labs with no searchable tags.", href: "/admin/labs", severity: "info" as const },
    { id: "article-tags", count: noArticleTags, label: "Untagged articles", detail: "Published articles with no searchable tags.", href: "/admin/journal", severity: "info" as const },
    { id: "scheduled", count: scheduled, label: "Legacy scheduled content", detail: "Scheduling is disabled; return these records to Draft.", href: "/admin/projects", severity: "warning" as const },
    { id: "certificate-links", count: noCredential, label: "Certificates without credential links", detail: "Completed published certificates missing verification URLs.", href: "/admin/certificates", severity: "warning" as const },
  ].filter((item) => item.count > 0);
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [health, metrics, publication, recentlyUpdated, attention] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    getMetrics(),
    getPublicationTotals(),
    getRecentlyUpdated(),
    getAttentionItems(),
  ]);
  const section = <T>(result: PromiseSettledResult<T>, name: string): DashboardSection<T> =>
    result.status === "fulfilled" ? { ok: true, data: result.value } : failed<T>(name, result.reason);
  const panels = [metrics, publication, recentlyUpdated, attention];
  return {
    health: health.status === "rejected" ? "unavailable" : panels.some((item) => item.status === "rejected") ? "degraded" : "connected",
    metrics: section(metrics, "metrics"),
    publication: section(publication, "publication"),
    recentlyUpdated: section(recentlyUpdated, "recently-updated"),
    attention: section(attention, "attention"),
  };
}
