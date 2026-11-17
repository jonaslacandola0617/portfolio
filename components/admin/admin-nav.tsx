"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award, BookOpen, Clapperboard, FlaskConical, FolderGit2, Home, Image as ImageIcon, LayoutDashboard, Settings, Tags, UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Grouped to mirror the public site: pages first, then the content they list. */
const groups = [
  {
    label: "Site",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Homepage", href: "/admin/homepage", icon: Home },
      { label: "About", href: "/admin/about", icon: UserRound },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Labs", href: "/admin/labs", icon: FlaskConical },
      { label: "Projects", href: "/admin/projects", icon: FolderGit2 },
      { label: "Certificates", href: "/admin/certificates", icon: Award },
      { label: "Writing", href: "/admin/journal", icon: BookOpen },
      { label: "Video & design", href: "/admin/video", icon: Clapperboard },
    ],
  },
  {
    label: "Library",
    items: [
      { label: "Media", href: "/admin/media", icon: ImageIcon },
      { label: "Skills", href: "/admin/skills", icon: Tags },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="thin-scroll flex-1 overflow-y-auto admin-nav-groups" aria-label="Admin">
      {groups.map((group) => (
        <div key={group.label} className="admin-nav-group">
          <p className="admin-nav-group-label">{group.label}</p>
          <ul>
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("admin-nav-link", active && "is-active")}>
                    <Icon className="admin-nav-icon" aria-hidden="true" />
                    <span className="admin-nav-link-label">{item.label}</span>
                    <span className="admin-nav-marker" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
