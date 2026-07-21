import { ImageIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default function AdminMediaPage() {
  return (
    <PlaceholderPage
      icon={ImageIcon}
      title="Media Library"
      description="Upload and manage images, Packet Tracer files, PCAPs, PDFs, and videos via Vercel Blob."
      phase="Phase 5"
    />
  );
}
