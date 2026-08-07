"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SaveStatusIndicator,
  type SaveStatus,
} from "@/components/editor/save-status";

type EditorHeaderState = {
  status: SaveStatus;
  errorMessage?: string | null;
  isSaving: boolean;
  save: () => void;
  retry: () => void;
};

const EditorHeaderBridge = React.createContext<
  ((state: EditorHeaderState | null) => void) | null
>(null);

export function useAuthoringEditorHeader(state: EditorHeaderState | null) {
  const setState = React.useContext(EditorHeaderBridge);

  React.useEffect(() => {
    if (!setState) return;
    setState(state);
    return () => setState(null);
  }, [setState, state]);
}

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
  const [editorHeader, setEditorHeader] = React.useState<EditorHeaderState | null>(null);

  if (!enabled) return <div className="space-y-8">{children}</div>;

  const sheetContent = {
    project: {
      label: "Project Metadata",
      description: "Taxonomy, dates, status, and resources for this project.",
    },
    lab: {
      label: "Lab Metadata",
      description: "Taxonomy, dates, status, and resources for this lab.",
    },
    "journal entry": {
      label: "Journal Metadata",
      description: "Taxonomy, publishing status, and summary for this journal entry.",
    },
    certificate: {
      label: "Certificate Metadata",
      description: "Credential details, dates, publishing status, and related skills.",
    },
  }[contentLabel];

  return (
    <EditorHeaderBridge.Provider value={setEditorHeader}>
      <div className="flex h-[calc(100dvh-53px)] min-h-0 flex-col overflow-hidden lg:h-[100dvh]">
        <div className="sticky top-[53px] z-20 shrink-0 bg-surface/95 backdrop-blur lg:top-0">
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {backHref && (
                <Link
                  href={backHref}
                  className="shrink-0 text-muted hover:text-text"
                  aria-label={`Back to ${contentLabel}`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              )}
              <div className="min-w-0">
                <p className="label">{contentLabel}</p>
                <p className="truncate font-display text-sm font-semibold text-text">
                  {title || "Untitled Draft"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {editorHeader && (
                <div className="hidden sm:block">
                  <SaveStatusIndicator
                    status={editorHeader.status}
                    errorMessage={editorHeader.errorMessage}
                    onRetry={editorHeader.retry}
                  />
                </div>
              )}

              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-medium text-text-dim hover:border-border-strong hover:text-text"
                  >
                    <SlidersHorizontal className="h-3 w-3" /> Metadata
                  </button>
                </SheetTrigger>
                <SheetContent className="p-0">
                  <SheetHeader className="text-left">
                    <SheetTitle>{sheetContent.label}</SheetTitle>
                    <SheetDescription>{sheetContent.description}</SheetDescription>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-hidden">{inspector}</div>
                </SheetContent>
              </Sheet>

              <button
                type="button"
                onClick={() => editorHeader?.save()}
                disabled={!editorHeader || editorHeader.isSaving}
                className="flex items-center gap-1.5 border border-border-strong bg-text px-3 py-1.5 text-xs font-medium text-surface disabled:opacity-50"
              >
                <Check className="h-3 w-3" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">{editor}</div>
      </div>
    </EditorHeaderBridge.Provider>
  );
}
