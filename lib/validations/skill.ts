import { z } from "zod";

export const skillFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  group: z.string().min(1, "Group is required"),
  level: z.enum(["learning", "practiced", "comfortable"]),
});

export type SkillFormValues = z.infer<typeof skillFormSchema>;
