import { MediaUpload } from "@/components/admin/media-upload";
import { MediaLibraryGrid } from "@/components/admin/media-library-grid";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function AdminMediaPage() {
  const media = await getAllMedia();
  return (
    <div className="px-6 py-8 sm:px-10">
      <h1 className="font-display text-2xl font-semibold text-text">Media Library</h1>
      <p className="mt-1 text-sm text-text-dim">Images and file attachments used across projects, labs, and journal entries.</p>
      <div className="mt-7"><MediaUpload /></div>
      <MediaLibraryGrid media={media} />
    </div>
  );
}
