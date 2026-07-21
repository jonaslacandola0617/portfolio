import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SkillForm } from "@/components/admin/skill-form";
import { getSkillForEdit } from "@/lib/services/skill-admin-service";

export default async function EditSkillPage({ params }: { params: { id: string } }) {
  const skill = await getSkillForEdit(params.id);
  if (!skill) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-10 md:px-10">
      <Link href="/admin/skills" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to skills
      </Link>
      <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">{skill.name}</h1>
      <SkillForm mode="edit" skill={skill} />
    </div>
  );
}
