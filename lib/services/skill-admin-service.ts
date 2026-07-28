import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { SkillFormValues } from "@/lib/validations/skill";
import { revalidateContent } from "@/lib/services/content-revalidation";
import { UNGROUPED_SKILL_GROUP, cleanSkillGroup, skillGroupKey } from "@/lib/skill-groups";

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

export async function getExistingSkillGroups(): Promise<string[]> {
  const rows = await prisma.skill.findMany({
    distinct: ["group"],
    select: { group: true },
    orderBy: { group: "asc" },
  });
  const groups = new Map<string, string>();
  for (const row of rows) {
    const cleaned = cleanSkillGroup(row.group);
    groups.set(skillGroupKey(cleaned), cleaned);
  }
  groups.set(skillGroupKey(UNGROUPED_SKILL_GROUP), UNGROUPED_SKILL_GROUP);
  return [...groups.values()].sort((left, right) => {
    if (left === UNGROUPED_SKILL_GROUP) return 1;
    if (right === UNGROUPED_SKILL_GROUP) return -1;
    return left.localeCompare(right);
  });
}

async function resolveSkillGroup(input: string): Promise<string> {
  const requested = cleanSkillGroup(input);
  const existing = await prisma.skill.findFirst({
    where: { group: { equals: requested, mode: "insensitive" } },
    select: { group: true },
  });
  return existing ? cleanSkillGroup(existing.group) : requested;
}

export async function createSkill(fm: SkillFormValues) {
  const group = await resolveSkillGroup(fm.group);
  const skill = await prisma.skill.create({ data: { ...fm, group } });
  revalidateContent("skill");
  return skill;
}

export async function updateSkill(id: string, fm: SkillFormValues) {
  const group = await resolveSkillGroup(fm.group);
  const skill = await prisma.skill.update({ where: { id }, data: { ...fm, group } });
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

export async function updateSkillGroup(id: string, input: string) {
  const group = await resolveSkillGroup(input);
  const skill = await prisma.skill.update({
    where: { id },
    data: { group },
    select: { id: true, group: true },
  });
  revalidateContent("skill");
  return skill;
}
