"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AuthoringWorkspace({
  enabled,
  contentLabel,
  sheetBodyOwnsScroll = false,
  children,
}: {
  enabled: boolean;
  storageKey: string;
  contentLabel: "project" | "lab" | "journal entry" | "certificate";
  sheetBodyOwnsScroll?: boolean;
  children: React.ReactNode;
}) {
  const parts = React.Children.toArray(children);
  const inspector = parts[0];
  const editor = parts.slice(1);

  if (!enabled) return <div className="space-y-8">{children}</div>;

  return (
    <div className="mx-auto flex min-h-0 w-full flex-col lg:h-[calc(100vh-7rem)] lg:w-4/5">
      <div className="mb-3 flex shrink-0 items-center justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="secondary">
              <SlidersHorizontal className="h-4 w-4" />
              {contentLabel.charAt(0).toUpperCase() +
                contentLabel.slice(1)}{" "}
              details
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)}{" "}
                Details
              </SheetTitle>
              <SheetDescription>
                Update the information displayed with this {contentLabel} on
                your public portfolio.
              </SheetDescription>
            </SheetHeader>
            <div
              className={
                sheetBodyOwnsScroll
                  ? "flex min-h-0 flex-1 flex-col"
                  : "min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3 scrollbar-thin"
              }
            >
              {inspector}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="min-h-0 flex-1">{editor}</div>
    </div>
  );
}
