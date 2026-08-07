"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/admin", idx: "00" },
  { label: "Projects", href: "/admin/projects", idx: "01" },
  { label: "Labs", href: "/admin/labs", idx: "02" },
  { label: "Journal", href: "/admin/journal", idx: "03" },
  { label: "Certificates", href: "/admin/certificates", idx: "04" },
  { label: "Skills", href: "/admin/skills", idx: "05" },
  { label: "Media Library", href: "/admin/media", idx: "06" },
  { label: "About", href: "/admin/about", idx: "07" },
  { label: "Settings", href: "/admin/settings", idx: "08" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="thin-scroll flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
      <ul>
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-200",
                  active ? "text-text" : "text-text-dim hover:text-text",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-0 h-full w-[2px] origin-center bg-cobalt transition-transform duration-300 ease-signal",
                    active ? "scale-y-100" : "scale-y-0",
                  )}
                />
                <span className="idx w-5 shrink-0">{item.idx}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
