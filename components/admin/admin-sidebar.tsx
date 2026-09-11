import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { AdminSearchDialog } from "@/components/admin/admin-search-dialog";
import { AdminNav } from "@/components/admin/admin-nav";

export async function AdminSidebar() {
  const session = await auth();

  return (
    <aside className="admin-control-sidebar fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r lg:flex">
      <div className="admin-control-brand border-b">
        <div className="admin-control-wordmark" aria-label="JL Control">
          <strong>JL<i>/</i></strong>
          <span>CONTROL</span>
        </div>
        <p className="admin-control-user">{session?.user?.name ?? "Portfolio Admin"}</p>
      </div>

      <AdminSearchDialog />
      <AdminNav />

      <div className="admin-control-sidebar-foot border-t">
        <div className="mb-2 flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="admin-control-view-site label flex min-w-0 flex-1 items-center justify-center gap-2 border px-3 py-2.5 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            <span>View site</span>
          </Link>
          <ThemeToggle compact />
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
