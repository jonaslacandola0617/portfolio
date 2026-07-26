"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/shared/search-dialog";
import type { SiteSettingsData } from "@/lib/db/queries/settings";

export function SiteChrome({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SiteSettingsData;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar settings={settings} />
      <MobileNav settings={settings} />
      <main id="main-content" className="lg:pl-[272px]">
        {children}
      </main>
      <SearchDialog />
    </>
  );
}
