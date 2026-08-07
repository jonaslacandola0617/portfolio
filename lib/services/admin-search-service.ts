"use server";

import { requireAdmin } from "@/lib/services/auth-service";
import { prisma } from "@/lib/db";

export interface AdminSearchResult {
  id: string;
  title: string;
  type: "project" | "lab" | "article" | "certificate";
  publishStatus: string;
  href: string;
}

export async function searchAdminContent(query: string): Promise<AdminSearchResult[]> {
  await requireAdmin();
  if (!query.trim()) return [];

  const [projects, labs, articles, certificates] = await Promise.all([
    prisma.project.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      select: { id: true, title: true, publishStatus: true },
      take: 5,
    }),
    prisma.lab.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      select: { id: true, title: true, publishStatus: true },
      take: 5,
    }),
    prisma.article.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      select: { id: true, title: true, publishStatus: true },
      take: 5,
    }),
    prisma.certificate.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true, publishStatus: true },
      take: 5,
    }),
  ]) as [
    { id: string; title: string; publishStatus: string }[],
    { id: string; title: string; publishStatus: string }[],
    { id: string; title: string; publishStatus: string }[],
    { id: string; name: string; publishStatus: string }[],
  ];

  return [
    ...projects.map((p) => ({ id: p.id, title: p.title, type: "project" as const, publishStatus: p.publishStatus, href: `/admin/projects/${p.id}` })),
    ...labs.map((l) => ({ id: l.id, title: l.title, type: "lab" as const, publishStatus: l.publishStatus, href: `/admin/labs/${l.id}` })),
    ...articles.map((a) => ({ id: a.id, title: a.title, type: "article" as const, publishStatus: a.publishStatus, href: `/admin/journal/${a.id}` })),
    ...certificates.map((c) => ({ id: c.id, title: c.name, type: "certificate" as const, publishStatus: c.publishStatus, href: `/admin/certificates/${c.id}` })),
  ];
}
