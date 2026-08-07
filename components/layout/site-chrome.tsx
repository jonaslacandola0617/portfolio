"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/shared/search-dialog";
import type { SiteSettingsData } from "@/lib/db/queries/settings";

export function SiteChrome({ children, settings }: { children: React.ReactNode; settings: SiteSettingsData }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return <>{children}</>;
  return (
    <div className="min-h-screen bg-surface">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-border-strong focus:bg-surface-2 focus:px-4 focus:py-2 focus:text-text">Skip to content</a>
      <Sidebar settings={settings} />
      <MobileNav settings={settings} />
      <main key={pathname} id="main-content" className="animate-route-rise lg:pl-[248px]">{children}</main>
      <SearchDialog />
    </div>
  );
}
