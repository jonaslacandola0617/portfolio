import "server-only";
import { prisma } from "@/lib/db";
import type { SkillCategory } from "@/types";

interface SkillRow {
  name: string;
  group: string;
  level: string;
  projects: { slug: string }[];
}

const iconForGroup: Record<string, string> = {
  Networking: "Network",
  Cybersecurity: "ShieldCheck",
  Programming: "Code2",
};

export async function getAllSkillCategories(): Promise<SkillCategory[]> {
  try {
    const skills = (await prisma.skill.findMany({
      include: { projects: { select: { slug: true } } },
      orderBy: { name: "asc" },
    })) as SkillRow[];

    const grouped = new Map<string, SkillCategory>();
    for (const skill of skills) {
      if (!grouped.has(skill.group)) {
        grouped.set(skill.group, {
          category: skill.group,
          icon: iconForGroup[skill.group] ?? "Network",
          skills: [],
        });
      }
      grouped.get(skill.group)!.skills.push({
        name: skill.name,
        level: skill.level as SkillCategory["skills"][number]["level"],
        relatedProjectSlugs: skill.projects.map((p) => p.slug),
      });
    }

    return Array.from(grouped.values());
  } catch (error) {
    console.error("[queries/skills] getAllSkillCategories failed, returning empty list:", error);
    return [];
  }
}
