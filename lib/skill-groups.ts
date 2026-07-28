export const UNGROUPED_SKILL_GROUP = "Ungrouped";

export function cleanSkillGroup(value: string | null | undefined): string {
  const cleaned = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned || /^(ungrouped|untagged)$/i.test(cleaned)) return UNGROUPED_SKILL_GROUP;
  return cleaned;
}

export function skillGroupKey(value: string | null | undefined): string {
  return cleanSkillGroup(value).toLocaleLowerCase();
}

export function isUngroupedSkillGroup(value: string | null | undefined): boolean {
  return skillGroupKey(value) === UNGROUPED_SKILL_GROUP.toLocaleLowerCase();
}
