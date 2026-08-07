"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Added during the pre-Phase-6 stabilization pass (Workstream B4) — the
 * six admin forms previously showed field-level Zod errors but nothing
 * at the form level: a failed save with no field errors (a duplicate
 * slug, a dropped DB connection) looked identical to success. Also used
 * for the query-param success banner shown after a create/update
 * redirect (`?created=1`/`?updated=1`) — see the relevant actions.ts
 * files, which append that param on success since those actions
 * navigate away immediately and have nowhere else to show a message.
 */
interface FormMessageProps {
  variant: "success" | "error";
  children: React.ReactNode;
  className?: string;
}

export function FormMessage({ variant, children, className }: FormMessageProps) {
  const isSuccess = variant === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 border px-3 py-2 text-sm",
        isSuccess
          ? "border-teal/30 bg-success/10 text-teal"
          : "border-vermilion/30 bg-vermilion-dim text-vermilion",
        className
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}
