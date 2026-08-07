"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Github, Linkedin } from "lucide-react";
import { navItems } from "@/lib/site-config";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Mark } from "@/components/shared/mark";
import { useSearch } from "@/hooks/use-search";

export function Sidebar({ settings }: { settings: SiteSettingsData }) {
  const pathname = usePathname();
  const { setOpen } = useSearch();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-surface lg:flex">
      <div className="flex items-center gap-3 border-b border-border px-6 py-6">
        <Mark size={30} />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-text">{settings.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{settings.role}</p>
        </div>
      </div>

      <button onClick={() => setOpen(true)} className="mx-4 mt-4 flex items-center gap-2 border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors duration-200 hover:border-border-strong hover:text-text-dim">
        <Search size={13} /> <span className="flex-1">Search</span>
        <kbd className="border border-border px-1 font-mono text-[10px]">/</kbd>
      </button>

      <nav className="thin-scroll mt-5 flex-1 overflow-y-auto px-3" aria-label="Primary navigation">
        <ul>
          {navItems.map((item, i) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={active ? "page" : undefined} className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${active ? "text-text" : "text-text-dim hover:text-text"}`}>
                  <span className={`absolute left-0 top-0 h-full w-[2px] origin-center bg-cobalt transition-transform duration-300 ease-signal ${active ? "scale-y-100" : "scale-y-0"}`} />
                  <span className="idx w-5 shrink-0">{String(i).padStart(2, "0")}</span>
                  <span className="font-body">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <a href={settings.githubUrl} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center border border-border text-text-dim transition-colors hover:border-border-strong hover:text-text" aria-label="GitHub"><Github size={14} /></a>
          <a href={settings.linkedinUrl} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center border border-border text-text-dim transition-colors hover:border-border-strong hover:text-text" aria-label="LinkedIn"><Linkedin size={14} /></a>
          <div className="ml-auto"><ThemeToggle compact /></div>
        </div>
        <Link href="/resume" className="label flex items-center justify-center border border-border-strong bg-text px-3 py-2 text-xs font-medium text-surface transition-opacity hover:opacity-85">Résumé</Link>
      </div>
    </aside>
  );
}
