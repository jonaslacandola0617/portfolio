import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { SkillFormValues } from "@/lib/validations/skill";
import { revalidateContent } from "@/lib/services/content-revalidation";

interface AdminSkillListItem {
  id: string;
  name: string;
  group: string;
  level: string;
  projects: { slug: string }[];
}

export async function getAllSkillsForAdmin(): Promise<AdminSkillListItem[]> {
  return prisma.skill.findMany({
    include: { projects: { select: { slug: true } } },
    orderBy: [{ group: "asc" }, { name: "asc" }],
  }) as Promise<AdminSkillListItem[]>;
}

export async function getSkillForEdit(id: string): Promise<AdminSkillListItem | null> {
  return prisma.skill.findUnique({
    where: { id },
    include: { projects: { select: { slug: true } } },
  }) as Promise<AdminSkillListItem | null>;
}

export async function createSkill(fm: SkillFormValues) {
  const skill = await prisma.skill.create({ data: fm });
  revalidateContent("skill");
  return skill;
}

export async function updateSkill(id: string, fm: SkillFormValues) {
  const skill = await prisma.skill.update({ where: { id }, data: fm });
  revalidateContent("skill");
  return skill;
}

export async function deleteSkill(id: string) {
  await prisma.skill.delete({ where: { id } });
  revalidateContent("skill");
}

/** Bulk delete for the management page's checkbox selection. Prisma
 *  cleans up the implicit Project/Certificate many-to-many join rows
 *  for each deleted skill automatically — no separate step needed. */
export async function deleteSkills(ids: string[]): Promise<number> {
  const count = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const records = await tx.skill.findMany({ where: { id: { in: ids } }, select: { id: true } });
    await tx.skill.deleteMany({ where: { id: { in: ids } } });
    return records.length;
  });

  revalidateContent("skill");
  return count;
}
