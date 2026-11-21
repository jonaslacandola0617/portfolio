"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Small sub-navigation for the video section (it isn't in the main menu). */
export function VideoLocalNav() {
  const pathname = usePathname();
  const items = [
    { label: "Overview", href: "/video" },
    { label: "All videos", href: "/video/work" },
  ] as const;

  return (
    <div className="video-subnav">
      <div className="video-subnav-inner">
        <span className="video-subnav-label">Video &amp; design</span>
        <nav aria-label="Video section" className="segmented">
          {items.map((item) => {
            const active = item.href === "/video" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn(active && "is-active")}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
