import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { getAllSkillsForAdmin } from "@/lib/services/skill-admin-service";

export default async function AdminSkillsPage() {
  const skills = await getAllSkillsForAdmin();

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

      {skills.length === 0 ? (
        <EmptyState icon={Layers} title="No skills yet" description="Add your first skill to get started." />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {skills.map((s) => (
            <Link key={s.id} href={`/admin/skills/${s.id}`} className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{s.name}</div>
                <div className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">
                  {s.group} · used by {s.projects.length} project{s.projects.length === 1 ? "" : "s"}
                </div>
              </div>
              <Badge variant="default">{s.level}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
