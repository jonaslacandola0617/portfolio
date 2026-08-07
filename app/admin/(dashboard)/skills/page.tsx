import Link from "next/link";
import { Plus } from "lucide-react";
import { GroupedSkillsManager } from "@/components/admin/grouped-skills-manager";
import { getAllSkillsForAdmin, getExistingSkillGroups } from "@/lib/services/skill-admin-service";

export default async function AdminSkillsPage() {
  const [skills, groups] = await Promise.all([getAllSkillsForAdmin(), getExistingSkillGroups()]);
  return (
    <div className="px-6 py-8 sm:px-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-text">Skills</h1>
        <Link href="/admin/skills/new" className="flex items-center gap-2 border border-border-strong bg-text px-4 py-2.5 text-sm font-medium text-surface"><Plus className="h-3.5 w-3.5" /> New skill</Link>
      </div>
      <GroupedSkillsManager
        groups={groups}
        initialSkills={skills.map((skill) => ({ id: skill.id, name: skill.name, group: skill.group, level: skill.level, projectCount: skill.projects.length }))}
      />
    </div>
  );
}
