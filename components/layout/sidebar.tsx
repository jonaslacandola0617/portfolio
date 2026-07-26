"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Mail, Download, Terminal, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig, navItems } from "@/lib/site-config";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { Icon } from "@/components/shared/icon-map";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { useSearch } from "@/hooks/use-search";

export function Sidebar({ settings }: { settings: SiteSettingsData }) {
  const pathname = usePathname();
  const { setOpen: setSearchOpen } = useSearch();

  return (
    <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-40 lg:w-[272px] lg:flex-col border-r border-border bg-background">
      <div className="flex flex-col h-full px-5 py-6">
        {/* Logo / identity */}
        <Link href="/" className="flex items-center gap-3 px-1 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 font-mono text-xs font-semibold text-primary">
            {siteConfig.initials}
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold text-foreground">
              {settings.name}
            </div>
            <div className="truncate font-mono text-[0.68rem] text-muted-foreground">
              {settings.role}
            </div>
          </div>
        </Link>

        <Separator className="my-5" />

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="mb-5 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">Search...</span>
          <kbd className="inline-flex h-5 items-center rounded border border-border px-1.5 font-mono text-[0.65rem]">
            ⌘K
          </kbd>
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin">
          <div className="px-2 pb-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground/70">
            Navigate
          </div>
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon
                  name={item.icon}
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4" />

        {/* Status line */}
        <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2 font-mono text-[0.68rem] text-muted-foreground">
          <Terminal className="h-3.5 w-3.5 text-success" />
          <span className="text-success">●</span>
          <span>status: learning</span>
        </div>

        {/* Social + resume */}
        <div className="flex items-center gap-1">
          <a
            href={settings.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href={settings.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href={`mailto:${settings.email}`}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Email"
          >
            <Mail className="h-4 w-4" />
          </a>
          <a
            href={settings.resumeUrl}
            download
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Download resume"
          >
            <Download className="h-4 w-4" />
          </a>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
