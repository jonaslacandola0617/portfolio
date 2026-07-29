"use client";

import * as React from "react";
import { PanelRightOpen } from "lucide-react";
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
  children,
}: {
  enabled: boolean;
  storageKey: string;
  contentLabel: "project" | "lab" | "journal entry" | "certificate";
  children: React.ReactNode;
}) {
  const parts = React.Children.toArray(children);
  const inspector = parts[0];
  const editor = parts.slice(1);

  if (!enabled) return <div className="space-y-8">{children}</div>;

  const sheetContent = {
    project: {
      label: "Project Details",
      description:
        "Update the summary, classification, publishing status, and supporting details shown with this project.",
    },
    lab: {
      label: "Lab Details",
      description:
        "Manage how this lab is categorized, dated, and presented to visitors.",
    },
    "journal entry": {
      label: "Journal Details",
      description:
        "Update the publishing details and summary shown with this journal entry.",
    },
    certificate: {
      label: "Certificate Details",
      description:
        "Manage the credential information displayed on the certifications page.",
    },
  }[contentLabel];

  return (
    <div className="mx-auto flex min-h-0 w-full flex-col lg:h-[calc(100vh-7rem)] lg:w-4/5">
      <div className="mb-3 flex shrink-0 items-center justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="group text-foreground hover:border-primary/40 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted/50"
            >
              <PanelRightOpen className="h-4 w-4" />
              <span className="font-mono">{sheetContent.label}</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{sheetContent.label}</SheetTitle>
              <SheetDescription>{sheetContent.description}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0">{inspector}</div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="min-h-0 flex-1">{editor}</div>
    </div>
  );
}
