import { MediaUpload } from "@/components/admin/media-upload";
import { MediaLibraryGrid } from "@/components/admin/media-library-grid";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function AdminMediaPage() {
  const media = await getAllMedia();
  return (
    <div>
      <PageHeader
        index="05"
        eyebrow="Portfolio assets."
        title="Media Library"
        description="Images and file attachments used across projects, labs, journal entries, and credentials."
      />
      <PageShell>
        <div className="mb-8"><MediaUpload /></div>
        <MediaLibraryGrid media={media} />
      </PageShell>
    </div>
  );
}
