"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Menu, X } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSearchDialog } from "@/components/admin/admin-search-dialog";
import { SignOutButton } from "@/components/admin/sign-out-button";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="admin-control-mobile-head sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <div className="admin-control-wordmark" aria-label="JL Control">
          <strong>JL<i>/</i></strong>
          <span>CONTROL</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center border border-white/20 text-[#f6f0e7]"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <nav
            onClick={(event) => event.stopPropagation()}
            className="admin-control-mobile-drawer admin-drawer-in absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col border-r"
            aria-label="CMS menu"
          >
            <div className="flex items-center justify-between border-b border-white/15 px-5 py-4">
              <div className="admin-control-wordmark">
                <strong>JL<i>/</i></strong>
                <span>CONTROL</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-[18px] w-[18px] text-[#f6f0e7]/70" />
              </button>
            </div>

            <AdminSearchDialog enableShortcuts={false} />
            <AdminNav onNavigate={() => setOpen(false)} />

            <div className="shrink-0 border-t border-white/15 px-4 py-3">
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="admin-control-view-site label mb-2 flex w-full items-center justify-center gap-2 border px-3 py-2.5"
              >
                <ExternalLink className="h-3 w-3" />
                <span>View site</span>
              </Link>
              <SignOutButton />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
