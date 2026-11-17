import type { Metadata } from "next";
// Admin styles load only on /admin routes, so public visitors never download them.
import "../admin-clean.css";
import "../admin-refresh.css";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-control">{children}</div>;
}
