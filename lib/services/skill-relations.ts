import "server-only";
import { prisma } from "@/lib/db";

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export async function skillRelationInput(
  names: string[],
  defaults: { group: string; level: string }
) {
  const unique = [...new Map(names.map((name) => [normalize(name), name.trim().replace(/\s+/g, " ")])).values()];
  const existing = await prisma.skill.findMany({
    where: { OR: unique.map((name) => ({ name: { equals: name, mode: "insensitive" } })) },
    select: { id: true, name: true },
  });
  const existingKeys = new Set(existing.map((skill) => normalize(skill.name)));
  return {
    connect: existing.map((skill) => ({ id: skill.id })),
    connectOrCreate: unique
      .filter((name) => !existingKeys.has(normalize(name)))
      .map((name) => ({
        where: { name },
        create: { name, ...defaults },
      })),
  };
}
