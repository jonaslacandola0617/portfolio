"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  FlaskConical,
  FolderGit2,
  GitCommitHorizontal,
  ImageIcon,
  Layers,
  LayoutDashboard,
  NotebookPen,
  Settings,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects", icon: FolderGit2 },
  { label: "Labs", href: "/admin/labs", icon: FlaskConical },
  { label: "Journal", href: "/admin/journal", icon: NotebookPen },
  { label: "Certificates", href: "/admin/certificates", icon: BadgeCheck },
  { label: "Timeline", href: "/admin/timeline", icon: GitCommitHorizontal },
  { label: "Skills", href: "/admin/skills", icon: Layers },
  { label: "Media Library", href: "/admin/media", icon: ImageIcon },
  { label: "About", href: "/admin/about", icon: UserRound },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin" aria-label="Admin">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md border border-transparent px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              active && "border-primary/25 bg-primary/10 font-medium text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground/80 group-hover:text-foreground",
                active && "text-primary"
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
