import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import type { SkillCategory } from "@/types";
import { isUngroupedSkillGroup } from "@/lib/skill-groups";

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

export const getAllSkillCategories = cache(async (): Promise<SkillCategory[]> =>
  readWithPolicy("skills.getAllSkillCategories", [], async () => {
    const skills = (await prisma.skill.findMany({
      include: {
        projects: {
          where: { publishStatus: "PUBLISHED" },
          select: { slug: true },
        },
      },
      orderBy: { name: "asc" },
    })) as SkillRow[];

    const grouped = new Map<string, SkillCategory>();
    for (const skill of skills) {
      const publicGroup = isUngroupedSkillGroup(skill.group) ? "" : skill.group;
      if (!grouped.has(publicGroup)) {
        grouped.set(publicGroup, {
          category: publicGroup,
          icon: iconForGroup[publicGroup] ?? "Network",
          skills: [],
        });
      }
      grouped.get(publicGroup)!.skills.push({
        name: skill.name,
        level: skill.level as SkillCategory["skills"][number]["level"],
        relatedProjectSlugs: skill.projects.map((project) => project.slug),
      });
    }
    return Array.from(grouped.values());
  })
);
