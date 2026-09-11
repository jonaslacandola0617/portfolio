"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Github, Linkedin, Menu, Search, X } from "lucide-react";
import { SearchDialog } from "@/components/shared/search-dialog";
import { useSearch } from "@/hooks/use-search";
import type { SiteSettingsData } from "@/lib/db/queries/settings";

const nav = [
  { label: "Work", href: "/projects" },
  { label: "Labs", href: "/labs" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
] as const;

export function SiteChrome({ children, settings }: { children: React.ReactNode; settings: SiteSettingsData }) {
  const pathname = usePathname();
  const { setOpen } = useSearch();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="public-stage min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-[#efe9dc] focus:px-4 focus:py-2 focus:text-[#11110f]">Skip to content</a>

      <header className="public-nav">
        <Link href="/" className="public-wordmark" aria-label={`${settings.name} home`}>
          <span>JL</span><i>/</i>
        </Link>

        <nav className="public-nav-links" aria-label="Primary navigation">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={active ? "is-active" : ""}>
                {item.label}<span aria-hidden="true">●</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setOpen(true)} className="public-search" aria-label="Search portfolio">
            <Search size={14} /><kbd>/</kbd>
          </button>
        </nav>

        <button type="button" onClick={() => setMenuOpen((value) => !value)} className="public-menu-toggle" aria-expanded={menuOpen} aria-label="Toggle menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {menuOpen ? (
        <div className="public-mobile-menu">
          <div className="public-mobile-shape" aria-hidden="true"><span /><i /><b /></div>
          <nav aria-label="Mobile navigation">
            {nav.map((item, index) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                <small>{String(index + 1).padStart(2, "0")}</small>{item.label}
              </Link>
            ))}
            <button type="button" onClick={() => { setMenuOpen(false); setOpen(true); }}>
              <small>05</small>Search
            </button>
          </nav>
          <div className="public-mobile-socials">
            <a href={settings.githubUrl} target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a>
            <a href={settings.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={15} /> LinkedIn</a>
            <Link href="/resume" onClick={() => setMenuOpen(false)}>Résumé</Link>
          </div>
        </div>
      ) : null}

      <main key={pathname} id="main-content" className="public-main animate-route-rise">{children}</main>
      <SearchDialog />
    </div>
  );
}
