import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabForm } from "@/components/admin/lab-form";
import { getLabForEdit } from "@/lib/services/lab-admin-service";

export default async function EditLabPage({ params }: { params: { id: string } }) {
  const lab = await getLabForEdit(params.id);
  if (!lab) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <Link href="/admin/labs" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to labs
      </Link>
      <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">{lab.title}</h1>
      <LabForm
        mode="edit"
        lab={{
          id: lab.id,
          title: lab.title,
          slug: lab.slug,
          purpose: lab.purpose,
          category: lab.category?.name ?? "",
          difficulty: lab.difficulty,
          progressStatus: lab.progressStatus,
          publishStatus: lab.publishStatus,
          tags: lab.tags.map((t) => t.name),
          labDate: lab.labDate.toISOString().slice(0, 10),
          scheduledFor: lab.scheduledFor ? lab.scheduledFor.toISOString().slice(0, 16) : "",
          content: lab.content as never,
        }}
      />
    </div>
  );
}
