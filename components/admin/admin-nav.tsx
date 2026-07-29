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
  Blocks,
  NotebookPen,
  Settings,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/admin", icon: Blocks },
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
    <nav
      className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin"
      aria-label="Admin"
    >
      <div className="px-2 pb-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground/70">
        Navigate
      </div>
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0",
                active
                  ? "text-primary"
                  : "text-muted-foreground/80 group-hover:text-foreground",
              )}
            />
            <span className="truncate">{item.label}</span>
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
