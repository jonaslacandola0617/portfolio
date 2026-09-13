import { VideoAdminNav } from "@/components/admin/video-admin-nav";

export default function VideoAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full"><VideoAdminNav />{children}</div>;
}
