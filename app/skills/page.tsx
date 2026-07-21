import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { SkillBadge } from "@/components/shared/skill-badge";
import { Icon } from "@/components/shared/icon-map";
import { getAllSkillCategories } from "@/lib/db/queries/skills";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage() {
  const skillCategories = await getAllSkillCategories();

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <PageHeader
        eyebrow="Skills"
        title="Skills"
        description="Organized by category rather than percentage bars — a skill I've only touched in one lab is marked 'Learning,' not scored 40%. Each linked skill points to where it was actually used."
      />

      {skillCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published skills yet.</p>
      ) : (
        <div className="space-y-10">
          {skillCategories.map((cat) => (
            <div key={cat.category}>
              <div className="mb-4 flex items-center gap-2">
                <Icon name={cat.icon} className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">{cat.category}</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {cat.skills.map((skill) => (
                  <SkillBadge key={skill.name} skill={skill} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 font-mono text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Learning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Practiced
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Comfortable
        </span>
      </div>
    </div>
  );
}
