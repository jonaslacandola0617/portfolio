import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { FormMessage } from "@/components/admin/form-message";
import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllSkillsForAdmin } from "@/lib/services/skill-admin-service";
import { deleteSkillAction, bulkDeleteSkillsAction } from "./actions";

export default async function AdminSkillsPage({
  searchParams,
}: {
  searchParams: { created?: string; updated?: string };
}) {
  const skills = await getAllSkillsForAdmin();

  const rows: ManagementListRow[] = skills.map((s) => ({
    id: s.id,
    title: s.name,
    subtitle: `${s.group} · used by ${s.projects.length} project${s.projects.length === 1 ? "" : "s"}`,
    badgeLabel: s.level,
    badgeVariant: "default",
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Skills</h1>
          <p className="mt-1 text-sm text-muted-foreground">{skills.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/skills/new"><Plus className="h-4 w-4" /> New skill</Link>
        </Button>
      </div>

      {searchParams.created === "1" && <FormMessage variant="success" className="mb-4">Skill created.</FormMessage>}
      {searchParams.updated === "1" && <FormMessage variant="success" className="mb-4">Skill updated.</FormMessage>}

      {skills.length === 0 ? (
        <EmptyState icon={Layers} title="No skills yet" description="Add your first skill to get started." />
      ) : (
        <ManagementList
          rows={rows}
          basePath="/admin/skills"
          itemLabelSingular="skill"
          itemLabelPlural="skills"
          deleteOneAction={deleteSkillAction}
          deleteManyAction={bulkDeleteSkillsAction}
        />
      )}
    </div>
  );
}
