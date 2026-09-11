import Link from "next/link";
import { Plus } from "lucide-react";
import { GroupedSkillsManager } from "@/components/admin/grouped-skills-manager";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { getAllSkillsForAdmin, getExistingSkillGroups } from "@/lib/services/skill-admin-service";

export default async function AdminSkillsPage() {
  const [skills, groups] = await Promise.all([getAllSkillsForAdmin(), getExistingSkillGroups()]);
  return (
    <div>
      <PageHeader index="05" eyebrow="Reusable capability taxonomy." title="Skills" />
      <PageShell>
        <div className="mb-7 flex items-center justify-end">
          <Link href="/admin/skills/new" className="flex items-center gap-2 border border-border-strong bg-text px-4 py-2.5 text-sm font-medium text-surface"><Plus className="h-3.5 w-3.5" /> New skill</Link>
        </div>
        <GroupedSkillsManager
          groups={groups}
          initialSkills={skills.map((skill) => ({ id: skill.id, name: skill.name, group: skill.group, level: skill.level, projectCount: skill.projects.length }))}
        />
      </PageShell>
    </div>
  );
}
