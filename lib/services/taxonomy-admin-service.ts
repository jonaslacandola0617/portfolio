import "server-only";
import { prisma } from "@/lib/db";
import type { TaxonomyKind, TaxonomySuggestion } from "@/lib/validations/taxonomy";

export async function searchTaxonomy(
  kind: TaxonomyKind,
  query: string,
  limit: number
): Promise<TaxonomySuggestion[]> {
  const contains = query ? { contains: query, mode: "insensitive" as const } : undefined;
  if (kind === "category") {
    return prisma.category.findMany({
      where: contains ? { name: contains } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: limit,
    });
  }
  if (kind === "tag") {
    return prisma.tag.findMany({
      where: contains ? { name: contains } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: limit,
    });
  }
  const skills = await prisma.skill.findMany({
    where: contains ? { name: contains } : undefined,
    select: { id: true, name: true, group: true, level: true },
    orderBy: { name: "asc" },
    take: limit,
  });
  return skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    detail: `${skill.group} · ${skill.level}`,
  }));
}
