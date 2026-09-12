import { VideoLocalNav } from "@/components/video/video-local-nav";

export default function VideoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface"><VideoLocalNav />{children}</div>;
}
