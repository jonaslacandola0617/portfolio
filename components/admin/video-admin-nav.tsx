"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overview", href: "/admin/video" },
  { label: "Homepage", href: "/admin/video/homepage" },
  { label: "Projects", href: "/admin/video/projects" },
] as const;

export function VideoAdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Video portfolio admin" className="border-b border-border bg-surface-2 px-5 sm:px-8">
      <div className="flex min-w-0 gap-6 overflow-x-auto">
        {items.map((item) => {
          const active = item.href === "/admin/video"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "label relative shrink-0 py-3 text-[10px] text-text-dim transition-colors hover:text-text",
                active && "text-text",
              )}
            >
              {item.label}
              <span className={cn("absolute inset-x-0 bottom-0 h-px bg-vermilion transition-transform", active ? "scale-x-100" : "scale-x-0")} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
