import { ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { MediaUpload } from "@/components/admin/media-upload";
import { MediaCard } from "@/components/admin/media-card";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function AdminMediaPage() {
  const media = await getAllMedia();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Media Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">{media.length} files</p>
      </div>

      <MediaUpload />

      <div className="mt-8">
        {media.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No media uploaded yet"
            description="Upload images, Packet Tracer files, PCAPs, PDFs, or videos above — they'll show up here, ready to reference from any project or lab."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {media.map((m) => (
              <MediaCard key={m.id} media={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
