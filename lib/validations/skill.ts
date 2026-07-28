import { z } from "zod";
import { UNGROUPED_SKILL_GROUP, cleanSkillGroup } from "@/lib/skill-groups";

export const skillGroupSchema = z.string().max(100).transform(cleanSkillGroup);

export const skillFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  group: skillGroupSchema.default(UNGROUPED_SKILL_GROUP),
  level: z.enum(["learning", "practiced", "comfortable"]),
});

export type SkillFormValues = z.infer<typeof skillFormSchema>;

export const updateSkillGroupSchema = z.object({
  id: z.string().min(1).max(128),
  group: skillGroupSchema,
});
