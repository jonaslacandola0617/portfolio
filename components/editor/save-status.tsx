"use client";

import { Check, Loader2, CircleDot, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "unsaved" | "saving" | "retrying" | "saved" | "error";

/**
 * Rewritten during the pre-Phase-6 stabilization pass (Workstream A5) to
 * fix a real, user-visible lie: the old "error" state's label read
 * "Couldn't save — retrying" while nothing was actually retrying —
 * autosave had simply stopped. This version adds a genuine "retrying"
 * state (used while useAutosave's automatic retry/backoff is actually
 * running) and an honest, final "error" state with the real failure
 * reason and a working Retry button — see hooks/use-autosave.ts.
 */
const config: Record<SaveStatus, { label: string; className: string }> = {
  idle: { label: "", className: "" },
  unsaved: { label: "Unsaved changes", className: "text-text-dim" },
  saving: { label: "Saving...", className: "text-text-dim" },
  retrying: { label: "Retrying...", className: "text-signal" },
  saved: { label: "Saved", className: "text-teal" },
  error: { label: "Save failed", className: "text-vermilion" },
};

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function SaveStatusIndicator({ status, errorMessage, onRetry }: SaveStatusIndicatorProps) {
  if (status === "idle") return <span className="h-4 w-24" />;

  const { label, className } = config[status];

  return (
    <div className="flex flex-col items-end gap-1" role="status" aria-live="polite">
      <span className={cn("flex items-center gap-1.5 font-mono text-xs", className)}>
        {(status === "saving" || status === "retrying") && <Loader2 className="h-3 w-3 animate-spin" />}
        {status === "saved" && <Check className="h-3 w-3" />}
        {status === "unsaved" && <CircleDot className="h-3 w-3" />}
        {status === "error" && <AlertTriangle className="h-3 w-3" />}
        {label}
      </span>
      {status === "error" && (
        <div className="flex items-center gap-2">
          {errorMessage && <span className="text-xs text-vermilion">{errorMessage}</span>}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="border border-vermilion/40 px-2 py-0.5 text-xs font-medium text-vermilion hover:bg-vermilion-dim"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
