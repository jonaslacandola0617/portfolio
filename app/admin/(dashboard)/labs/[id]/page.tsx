import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabForm } from "@/components/admin/lab-form";
import { getLabForEdit } from "@/lib/services/lab-admin-service";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function EditLabPage({
  params,
}: {
  params: { id: string };
}) {
  const [lab, media] = await Promise.all([
    getLabForEdit(params.id),
    getAllMedia(),
  ]);
  if (!lab) notFound();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">
      <Link
        href="/admin/labs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to labs
      </Link>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted-foreground">
        Edit the lab write-up below. Use Lab details to manage its purpose,
        classification, resources, date, and public visibility.
      </p>
      <LabForm
        mode="edit"
        media={media}
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
          scheduledFor: lab.scheduledFor
            ? lab.scheduledFor.toISOString().slice(0, 16)
            : "",
          content: lab.content as never,
          downloads: lab.downloads
            .filter((download) => download.mediaId)
            .map((download) => ({
              mediaId: download.mediaId!,
              label: download.label,
              description: download.description ?? "",
            })),
        }}
      />
    </div>
  );
}
