"use client";

import { Check, Loader2, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

const config: Record<SaveStatus, { label: string; className: string }> = {
  idle: { label: "", className: "" },
  unsaved: { label: "Unsaved changes", className: "text-muted-foreground" },
  saving: { label: "Saving...", className: "text-muted-foreground" },
  saved: { label: "Saved", className: "text-success" },
  error: { label: "Couldn't save — retrying", className: "text-destructive" },
};

export function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return <span className="h-4 w-24" />;

  const { label, className } = config[status];

  return (
    <span className={cn("flex items-center gap-1.5 font-mono text-xs", className)}>
      {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "saved" && <Check className="h-3 w-3" />}
      {status === "unsaved" && <CircleDot className="h-3 w-3" />}
      {status === "error" && <CircleDot className="h-3 w-3" />}
      {label}
    </span>
  );
}
