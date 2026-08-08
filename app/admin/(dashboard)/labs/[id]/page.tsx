import { notFound } from "next/navigation";
import { LabForm } from "@/components/admin/lab-form";
import { getLabForEdit } from "@/lib/services/lab-admin-service";
import { getAllMedia } from "@/lib/services/media-admin-service";

type LabEditParams = Promise<{ id: string }>;

export default async function EditLabPage({ params }: { params: LabEditParams }) {
  const { id } = await params;
  const [lab, media] = await Promise.all([getLabForEdit(id), getAllMedia()]);
  if (!lab) notFound();
  return (
    <LabForm
      mode="edit"
      media={media}
      lab={{
        id: lab.id, title: lab.title, slug: lab.slug, purpose: lab.purpose,
        category: lab.category?.name ?? "", difficulty: lab.difficulty,
        progressStatus: lab.progressStatus, publishStatus: lab.publishStatus,
        tags: lab.tags.map((t) => t.name), labDate: lab.labDate.toISOString().slice(0, 10),
        scheduledFor: lab.scheduledFor ? lab.scheduledFor.toISOString().slice(0, 16) : "",
        content: lab.content as never,
        downloads: lab.downloads.filter((download) => download.mediaId).map((download) => ({
          mediaId: download.mediaId!, label: download.label, description: download.description ?? "",
        })),
      }}
    />
  );
}
