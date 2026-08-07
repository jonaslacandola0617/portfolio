"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AuthoringWorkspace({
  enabled,
  contentLabel,
  title,
  backHref,
  children,
}: {
  enabled: boolean;
  storageKey: string;
  contentLabel: "project" | "lab" | "journal entry" | "certificate";
  title?: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  const parts = React.Children.toArray(children);
  const inspector = parts[0];
  const editor = parts.slice(1);

  if (!enabled) return <div className="space-y-8">{children}</div>;

  const sheetContent = {
    project: { label: "Project Metadata", description: "Taxonomy, dates, status, and resources for this project." },
    lab: { label: "Lab Metadata", description: "Taxonomy, dates, status, and resources for this lab." },
    "journal entry": { label: "Journal Metadata", description: "Taxonomy, publishing status, and summary for this journal entry." },
    certificate: { label: "Certificate Metadata", description: "Credential details, dates, publishing status, and related skills." },
  }[contentLabel];

  return (
    <div className="flex min-h-[calc(100vh-53px)] flex-col lg:min-h-screen">
      <div className="sticky top-[53px] z-20 border-b border-border bg-surface lg:top-0">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {backHref && (
              <Link href={backHref} className="shrink-0 text-muted hover:text-text" aria-label={`Back to ${contentLabel}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            <div className="min-w-0">
              <p className="label">{contentLabel}</p>
              <p className="truncate font-display text-sm font-semibold text-text">{title || "Untitled Draft"}</p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button type="button" className="flex shrink-0 items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-medium text-text-dim hover:border-border-strong hover:text-text">
                <SlidersHorizontal className="h-3 w-3" /> Metadata
              </button>
            </SheetTrigger>
            <SheetContent className="border-l border-border-strong bg-surface-2 p-0 sm:max-w-md">
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle className="font-display text-base font-semibold text-text">{sheetContent.label}</SheetTitle>
                <SheetDescription className="mt-1 text-xs text-text-dim">{sheetContent.description}</SheetDescription>
              </SheetHeader>
              <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">{inspector}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="min-h-0 flex-1">{editor}</div>
    </div>
  );
}
