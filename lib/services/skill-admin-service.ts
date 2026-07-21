import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { SkillFormValues } from "@/lib/validations/skill";

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
  await revalidateSkillPaths();
  return skill;
}

export async function updateSkill(id: string, fm: SkillFormValues) {
  const skill = await prisma.skill.update({ where: { id }, data: fm });
  await revalidateSkillPaths();
  return skill;
}

export async function deleteSkill(id: string) {
  await prisma.skill.delete({ where: { id } });
  await revalidateSkillPaths();
}

async function revalidateSkillPaths() {
  revalidatePath("/skills");
  revalidatePath("/projects");
}
