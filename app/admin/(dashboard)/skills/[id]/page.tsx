import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SkillForm } from "@/components/admin/skill-form";
import {
  getExistingSkillGroups,
  getSkillForEdit,
} from "@/lib/services/skill-admin-service";

export default async function EditSkillPage({
  params,
}: {
  params: { id: string };
}) {
  const [skill, groups] = await Promise.all([
    getSkillForEdit(params.id),
    getExistingSkillGroups(),
  ]);
  if (!skill) notFound();

  return (
    <div className="px-6 py-8 sm:px-10">
      <Link
        href="/admin/skills"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to skills
      </Link>
      <h1 className="font-display text-2xl font-semibold text-text">
        {skill.name}
      </h1>

      <SkillForm mode="edit" skill={skill} groups={groups} />
    </div>
  );
}
