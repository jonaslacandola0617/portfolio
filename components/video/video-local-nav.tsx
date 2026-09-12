"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function VideoLocalNav() {
  const pathname = usePathname();
  const items = [
    { label: "Home", href: "/video" },
    { label: "Work", href: "/video/work" },
  ] as const;

  return (
    <div className="border-b border-border bg-surface/95">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-5 py-3 sm:px-8 lg:px-12">
        <Link href="/video" className="label text-[10px] text-text">VIDEO</Link>
        <nav aria-label="Video portfolio" className="flex items-center gap-5">
          {items.map((item) => {
            const active = item.href === "/video" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("label text-[10px] text-text-dim transition-colors hover:text-text", active && "text-vermilion")}>{item.label}</Link>;
          })}
        </nav>
      </div>
    </div>
  );
}
