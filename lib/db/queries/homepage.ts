import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";

export interface HomepageStat {
  label: "Labs Logged" | "Projects Shipped" | "Journal Entries" | "Certifications";
  value: number;
}

export interface HomepageActivity {
  id: string;
  type: "Project" | "Lab" | "Article" | "Certificate";
  title: string;
  href: string;
  updatedAt: string;
}

export interface HomepageOverview {
  stats: HomepageStat[];
  recentActivity: HomepageActivity[];
}

const emptyOverview = (): HomepageOverview => ({
  stats: [
    { label: "Labs Logged", value: 0 },
    { label: "Projects Shipped", value: 0 },
    { label: "Journal Entries", value: 0 },
    { label: "Certifications", value: 0 },
  ],
  recentActivity: [],
});

export const getHomepageOverview = cache(async (): Promise<HomepageOverview> =>
  readWithPolicy("homepage.getOverview", emptyOverview, async () => {
    const [
      labCount,
      projectCount,
      articleCount,
      certificateCount,
      projects,
      labs,
      articles,
      certificates,
    ] = await Promise.all([
      prisma.lab.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.project.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.article.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.certificate.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.project.findMany({
        where: { publishStatus: "PUBLISHED" },
        select: { id: true, title: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.lab.findMany({
        where: { publishStatus: "PUBLISHED" },
        select: { id: true, title: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.article.findMany({
        where: { publishStatus: "PUBLISHED" },
        select: { id: true, title: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.certificate.findMany({
        where: { publishStatus: "PUBLISHED" },
        select: { id: true, name: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
    ]);

    const recentActivity: HomepageActivity[] = [
      ...projects.map((item) => ({
        id: item.id,
        type: "Project" as const,
        title: item.title,
        href: `/projects/${item.slug}`,
        updatedAt: item.updatedAt.toISOString(),
      })),
      ...labs.map((item) => ({
        id: item.id,
        type: "Lab" as const,
        title: item.title,
        href: `/labs/${item.slug}`,
        updatedAt: item.updatedAt.toISOString(),
      })),
      ...articles.map((item) => ({
        id: item.id,
        type: "Article" as const,
        title: item.title,
        href: `/journal/${item.slug}`,
        updatedAt: item.updatedAt.toISOString(),
      })),
      ...certificates.map((item) => ({
        id: item.id,
        type: "Certificate" as const,
        title: item.name,
        href: "/certifications",
        updatedAt: item.updatedAt.toISOString(),
      })),
    ]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 4);

    return {
      stats: [
        { label: "Labs Logged", value: labCount },
        { label: "Projects Shipped", value: projectCount },
        { label: "Journal Entries", value: articleCount },
        { label: "Certifications", value: certificateCount },
      ],
      recentActivity,
    };
  })
);
