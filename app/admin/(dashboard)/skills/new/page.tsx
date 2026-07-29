import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SkillForm } from "@/components/admin/skill-form";
import { getExistingSkillGroups } from "@/lib/services/skill-admin-service";

export default async function NewSkillPage() {
  const groups = await getExistingSkillGroups();
  return (
    <div className="mx-auto max-w-lg px-6 py-10 md:px-10">
      <Link href="/admin/skills" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to skills
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">New skill</h1>
      <p className="mb-6 mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
        Add a skill, choose its public proficiency level, and assign it to an
        existing or new group.
      </p>
      <SkillForm mode="create" groups={groups} />
    </div>
  );
}
