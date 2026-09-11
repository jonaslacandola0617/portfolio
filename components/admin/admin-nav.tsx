"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Content",
    items: [
      { label: "Dashboard", href: "/admin", idx: "00" },
      { label: "Projects", href: "/admin/projects", idx: "01" },
      { label: "Labs", href: "/admin/labs", idx: "02" },
      { label: "Journal", href: "/admin/journal", idx: "03" },
      { label: "Certificates", href: "/admin/certificates", idx: "04" },
    ],
  },
  {
    label: "Assets",
    items: [
      { label: "Skills", href: "/admin/skills", idx: "05" },
      { label: "Media Library", href: "/admin/media", idx: "06" },
    ],
  },
  {
    label: "Presentation",
    items: [
      { label: "About", href: "/admin/about", idx: "07" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", idx: "08" },
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
    <nav className="thin-scroll flex-1 overflow-y-auto" aria-label="Admin">
      {groups.map((group) => (
        <section className="admin-nav-group" key={group.label}>
          <span className="admin-nav-group-label">{group.label}</span>
          <ul>
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn("admin-nav-link", active && "is-active")}
                  >
                    <span className="idx">{item.idx}</span>
                    <span className="admin-nav-link-label">{item.label}</span>
                    <span className="admin-nav-marker" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
