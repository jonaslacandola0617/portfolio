"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeftOpen, SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AuthoringWorkspace({
  enabled,
  storageKey,
  children,
}: {
  enabled: boolean;
  storageKey: string;
  children: React.ReactNode;
}) {
  const parts = React.Children.toArray(children);
  const inspector = parts[0];
  const editor = parts.slice(1);
  const [open, setOpen] = React.useState(true);
  const [desktop, setDesktop] = React.useState(false);

  React.useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored !== null) setOpen(stored !== "collapsed");
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [storageKey]);

  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      sessionStorage.setItem(storageKey, next ? "open" : "collapsed");
      return next;
    });
  };

  if (!enabled) return <div className="space-y-8">{children}</div>;

  if (!desktop) {
    return (
      <div className="min-w-0">
        <div className="mb-3">
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground">
                <SlidersHorizontal className="h-4 w-4" />Edit metadata
              </button>
            </DialogTrigger>
            <DialogContent className="left-auto right-0 top-0 h-screen max-w-sm translate-x-0 overflow-y-auto rounded-none p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Metadata</h2>
              {inspector}
            </DialogContent>
          </Dialog>
        </div>
        {editor}
      </div>
    );
  }

  return (
    <div className={cn("grid items-start gap-5", open ? "lg:grid-cols-[360px_minmax(0,1fr)]" : "lg:grid-cols-[44px_minmax(0,1fr)]")}>
      <aside>
        {open ? (
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card/40 p-3 scrollbar-thin">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">Metadata</span>
              <button type="button" onClick={toggle} aria-label="Collapse metadata inspector" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><PanelLeftClose className="h-4 w-4" /></button>
            </div>
            {inspector}
          </div>
        ) : (
          <button type="button" onClick={toggle} aria-label="Open metadata inspector" className="sticky top-4 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"><PanelLeftOpen className="h-4 w-4" /></button>
        )}
      </aside>

      <div className="min-w-0">
        {editor}
      </div>
    </div>
  );
}
