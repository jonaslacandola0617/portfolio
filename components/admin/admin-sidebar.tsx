import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { auth } from "@/auth";
import { Mark } from "@/components/shared/mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { AdminSearchDialog } from "@/components/admin/admin-search-dialog";
import { AdminNav } from "@/components/admin/admin-nav";

export async function AdminSidebar() {
  const session = await auth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-surface lg:flex">
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-6">
        <Mark size={30} />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-text">CMS</p>
          <p className="truncate text-[11px] text-muted">
            {session?.user?.name ?? "Portfolio Admin"}
          </p>
        </div>
      </div>

      <AdminSearchDialog />
      <AdminNav />

      <div className="border-t border-border px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="label flex w-full items-center justify-center gap-2 border border-border-strong bg-text px-3 py-2 text-surface transition-opacity hover:opacity-85"
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
