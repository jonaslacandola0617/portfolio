import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { AdminSearchDialog } from "@/components/admin/admin-search-dialog";
import { Separator } from "@/components/ui/separator";
import { AdminNav } from "@/components/admin/admin-nav";

export async function AdminSidebar() {
  const session = await auth();

  return (
    <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-40 lg:w-[272px] lg:flex-col border-r border-border bg-background">
      <div className="flex flex-col h-full px-5 py-6">
        <Link href="/admin" className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 font-mono text-xs font-semibold text-primary">
            CMS
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold text-foreground">
              Administration
            </div>
            <div className="truncate font-mono text-[0.68rem] text-muted-foreground">
              Content Management System
            </div>
          </div>
        </Link>

        <Separator className="my-5" />

        <AdminSearchDialog />

        <AdminNav />

        <Separator className="my-4" />

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="mb-3 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View public site
        </a>

        <div className="flex items-center gap-2 rounded-md px-1 py-1">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {session?.user?.name ?? "Admin"}
            </div>
            <div className="truncate font-mono text-[0.65rem] text-muted-foreground">
              {session?.user?.email}
            </div>
          </div>
          <ThemeToggle />
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
