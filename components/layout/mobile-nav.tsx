"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, Github, Linkedin } from "lucide-react";
import { navItems } from "@/lib/site-config";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Mark } from "@/components/shared/mark";
import { useSearch } from "@/hooks/use-search";
import type { SiteSettingsData } from "@/lib/db/queries/settings";

export function MobileNav({ settings }: { settings: SiteSettingsData }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { setOpen: setSearchOpen } = useSearch();
  React.useEffect(() => setOpen(false), [pathname]);
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2.5"><Mark size={26} /><span className="font-display text-sm font-semibold text-text">{settings.name.split(" ").map(w=>w[0]).join("").toUpperCase()}</span></Link>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSearchOpen(true)} aria-label="Open search" className="flex h-9 w-9 items-center justify-center border border-border text-text-dim"><Search size={15} /></button>
          <ThemeToggle compact />
          <button onClick={() => setOpen(true)} aria-label="Open navigation" className="flex h-9 w-9 items-center justify-center border border-border text-text-dim"><Menu size={16} /></button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 bg-ink/70 lg:hidden animate-fade-in" onClick={() => setOpen(false)}>
          <nav onClick={(e)=>e.stopPropagation()} className="absolute inset-y-0 right-0 flex w-[82%] max-w-xs flex-col border-l border-border-strong bg-surface animate-[slideIn_.28s_cubic-bezier(.16,1,.3,1)]" aria-label="Mobile navigation">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><span className="label">Navigate</span><button onClick={()=>setOpen(false)} aria-label="Close navigation"><X size={18} className="text-text-dim" /></button></div>
            <ul className="thin-scroll flex-1 overflow-y-auto px-2 py-2">
              {navItems.map((item,i)=>{const active=item.href==="/"?pathname==="/":pathname.startsWith(item.href); return <li key={item.href}><Link href={item.href} className={`flex items-center gap-3 px-3 py-3 text-sm ${active?"text-text":"text-text-dim"}`}><span className="idx w-5">{String(i).padStart(2,"0")}</span>{item.label}</Link></li>;})}
            </ul>
            <div className="flex items-center gap-2 border-t border-border px-5 py-4">
              <a href={settings.githubUrl} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center border border-border" aria-label="GitHub"><Github size={15} className="text-text-dim" /></a>
              <a href={settings.linkedinUrl} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center border border-border" aria-label="LinkedIn"><Linkedin size={15} className="text-text-dim" /></a>
            </div>
          </nav>
        </div>
      )}
      <style jsx global>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </>
  );
}
