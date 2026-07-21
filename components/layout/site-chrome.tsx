"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/shared/search-dialog";

/**
 * Everything under /admin is a "completely separate admin experience"
 * (per the CMS brief) — it gets its own sidebar (components/admin/
 * admin-sidebar.tsx, rendered by app/admin/(dashboard)/layout.tsx), not
 * the public one.
 *
 * The alternative to this component would be moving every existing
 * public route into an app/(site)/ route group so it could have its own
 * layout.tsx. That's a same-URLs, zero-risk move in theory, but it
 * touches the location of every public page file for a problem this
 * pathname check solves by touching exactly one file instead. If the
 * project ever needs genuinely different root-level HTML (not just
 * different chrome) for /admin, revisit that route-group approach then.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
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
      <Sidebar />
      <MobileNav />
      <main id="main-content" className="lg:pl-[272px]">
        {children}
      </main>
      <SearchDialog />
    </>
  );
}
