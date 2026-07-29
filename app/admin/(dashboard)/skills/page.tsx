import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { QuerySuccessToast } from "@/components/admin/query-success-toast";
import { GroupedSkillsManager } from "@/components/admin/grouped-skills-manager";
import { getAllSkillsForAdmin, getExistingSkillGroups } from "@/lib/services/skill-admin-service";

export default async function AdminSkillsPage() {
  const [skills, groups] = await Promise.all([getAllSkillsForAdmin(), getExistingSkillGroups()]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Skills</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Organize the skills shown publicly, update their proficiency level,
            and move them between groups. {skills.length} total.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/skills/new"><Plus className="h-4 w-4" /> New skill</Link>
        </Button>
      </div>

      <QuerySuccessToast
        messages={{ created: "Skill created.", updated: "Skill updated." }}
      />

      {skills.length === 0 ? (
        <EmptyState icon={Layers} title="No skills yet" description="Add a skill and assign its public proficiency level and optional group." />
      ) : (
        <GroupedSkillsManager
          groups={groups}
          initialSkills={skills.map((skill) => ({
            id: skill.id,
            name: skill.name,
            group: skill.group,
            level: skill.level,
            projectCount: skill.projects.length,
          }))}
        />
      )}
    </div>
  );
}
