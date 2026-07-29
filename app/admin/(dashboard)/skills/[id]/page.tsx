import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SkillForm } from "@/components/admin/skill-form";
import { getExistingSkillGroups, getSkillForEdit } from "@/lib/services/skill-admin-service";

export default async function EditSkillPage({ params }: { params: { id: string } }) {
  const [skill, groups] = await Promise.all([getSkillForEdit(params.id), getExistingSkillGroups()]);
  if (!skill) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-10 md:px-10">
      <Link href="/admin/skills" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to skills
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">{skill.name}</h1>
      <p className="mb-6 mt-1 text-sm leading-6 text-muted-foreground">
        Update the skill name, public proficiency level, and grouping used on
        the portfolio.
      </p>
      <SkillForm mode="edit" skill={skill} groups={groups} />
    </div>
  );
}
