"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overview", href: "/admin/video" },
  { label: "Video page", href: "/admin/video/homepage" },
  { label: "Videos", href: "/admin/video/projects" },
] as const;

export function VideoAdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Video admin" className="admin-subnav">
      {items.map((item) => {
        const active = item.href === "/admin/video"
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn(active && "is-active")}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
