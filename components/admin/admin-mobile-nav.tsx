"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Menu, X } from "lucide-react";
import { Mark } from "@/components/shared/mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSearchDialog } from "@/components/admin/admin-search-dialog";
import { SignOutButton } from "@/components/admin/sign-out-button";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Mark size={22} />
          <span className="font-display text-sm font-semibold text-text">CMS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center border border-border text-text-dim"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/70 lg:hidden"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <nav
            onClick={(event) => event.stopPropagation()}
            className="admin-drawer-in absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col border-r border-border-strong bg-surface"
            aria-label="CMS menu"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="label">CMS Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-[18px] w-[18px] text-text-dim" />
              </button>
            </div>

            <AdminSearchDialog enableShortcuts={false} />
            <AdminNav onNavigate={() => setOpen(false)} />

            <div className="shrink-0 border-t border-border px-4 py-3">
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="label mb-2 flex w-full items-center justify-center gap-2 border border-border-strong bg-text px-3 py-2 text-surface transition-opacity hover:opacity-85"
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
