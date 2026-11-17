"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, FileText, Github, Linkedin, Menu, Search, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchDialog } from "@/components/shared/search-dialog";
import { CopyEmail, LocalTime, ScrollProgress } from "@/components/site/interactive";
import { useSearch } from "@/hooks/use-search";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Work", href: "/projects" },
  { label: "Labs", href: "/labs" },
  { label: "Writing", href: "/journal" },
  { label: "Video", href: "/video" },
  { label: "About", href: "/about" },
] as const;

function useHeaderState() {
  const [state, setState] = useState({ scrolled: false, hidden: false });

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const goingDown = y > last + 4;
      const goingUp = y < last - 4;
      setState((current) => {
        const next = {
          scrolled: y > 12,
          hidden: y > 320 ? (goingDown ? true : goingUp ? false : current.hidden) : false,
        };
        return next.scrolled === current.scrolled && next.hidden === current.hidden ? current : next;
      });
      last = y;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return state;
}

export function SiteChrome({ children, settings }: { children: React.ReactNode; settings: SiteSettingsData }) {
  const pathname = usePathname();
  const { setOpen } = useSearch();
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrolled, hidden } = useHeaderState();

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (pathname?.startsWith("/admin")) return <>{children}</>;

  const [firstName, ...rest] = settings.name.split(" ");

  return (
    <div className="public-stage site">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <ScrollProgress />

      <header className={cn("site-header", scrolled && "is-scrolled", hidden && !menuOpen && "is-hidden")}>
        <Link href="/" className="site-mark" aria-label={`${settings.name} — home`}>
          <span className="site-mark-glyph" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="site-mark-name">{firstName}<span>{rest.join(" ")}</span></span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-actions">
          <button type="button" onClick={() => setOpen(true)} className="icon-button" aria-label="Search the portfolio (press /)">
            <Search size={15} />
          </button>
          <ThemeToggle compact />
          <Link href="/resume" className="btn btn-ghost btn-sm site-hide-sm"><FileText size={14} /> Résumé</Link>
          <Link href="/contact" className="btn btn-solid btn-sm site-hide-sm">Contact</Link>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="icon-button site-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={cn("mobile-menu", menuOpen && "is-open")} aria-hidden={!menuOpen} inert={!menuOpen ? true : undefined}>
        <nav aria-label="Mobile navigation">
          {[...nav, { label: "Résumé", href: "/resume" }, { label: "Contact", href: "/contact" }].map((item, index) => (
            <Link key={item.href} href={item.href} style={{ transitionDelay: menuOpen ? `${60 + index * 35}ms` : "0ms" }}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setMenuOpen(false); setOpen(true); }}><Search size={14} /> Search</button>
          <a href={settings.githubUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Github size={14} /> GitHub</a>
          <a href={settings.linkedinUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Linkedin size={14} /> LinkedIn</a>
        </div>
      </div>

      <main key={pathname} id="main-content" className="site-main animate-route-rise">{children}</main>

      <SiteFooter settings={settings} showCta={pathname !== "/contact"} />
      <SearchDialog />
    </div>
  );
}

function SiteFooter({ settings, showCta }: { settings: SiteSettingsData; showCta: boolean }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      {showCta ? (
      <div className="site-footer-cta">
        <p className="eyebrow"><span className="pulse-dot" aria-hidden="true" /> Open to new roles</p>
        <h2>
          Have a role or a project in mind?
          <span> Let&apos;s talk.</span>
        </h2>
        <div className="site-footer-actions">
          <CopyEmail email={settings.email} className="copy-email-lg" />
          <Link href="/contact" className="btn btn-solid">Send a message <ArrowUpRight size={16} /></Link>
          <Link href="/resume" className="btn btn-ghost"><FileText size={15} /> View résumé</Link>
        </div>
      </div>
      ) : null}

      <div className="site-footer-grid">
        <div>
          <p className="footer-label">Elsewhere</p>
          <a href={settings.githubUrl} target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a>
          <a href={settings.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={14} /> LinkedIn</a>
        </div>
        <div>
          <p className="footer-label">Explore</p>
          <Link href="/projects">Work</Link>
          <Link href="/labs">Labs</Link>
          <Link href="/journal">Writing</Link>
          <Link href="/certifications">Certifications</Link>
        </div>
        <div>
          <p className="footer-label">Local time</p>
          <LocalTime />
          <p className="footer-note">Usually replies within 1–2 business days.</p>
        </div>
      </div>

      <div className="site-footer-base">
        <span>© {year} {settings.name}</span>
        <span>Designed &amp; built by hand — Next.js, TypeScript, PostgreSQL.</span>
      </div>
    </footer>
  );
}
