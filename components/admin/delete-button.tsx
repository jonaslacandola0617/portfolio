"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeleteResult } from "@/types/admin";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";

/**
 * Replaces the invalid nested `<form>`-inside-`<form>` delete pattern
 * every edit page used before the pre-Phase-6 stabilization pass
 * (Workstream D1) — each of the six edit forms wrapped its whole
 * metadata form in one `<form action={formAction}>`, then nested a
 * second `<form action={...}>` around the Delete button inside it.
 * Nested forms are invalid HTML; browsers resolve them inconsistently
 * (typically by ignoring/hoisting the inner form), which made delete
 * behavior unreliable. This is a plain client component invoked via
 * `onClick`/`useTransition`, rendered as a *sibling* of the metadata
 * form, not nested inside it.
 *
 * Used both standalone on edit pages (`onSuccess` navigates away) and
 * inside `ManagementList` for a row's individual delete (`onSuccess`
 * refreshes the list in place) — see that component.
 */
interface DeleteButtonProps {
  onDelete: () => Promise<DeleteResult>;
  onSuccess: () => void;
  contentType: string;
  recordTitle: string;
  description?: string;
  label?: string;
  variant?: "default" | "icon";
  className?: string;
}

export function DeleteButton({
  onDelete,
  onSuccess,
  contentType,
  recordTitle,
  description,
  label = "Delete",
  variant = "default",
  className,
}: DeleteButtonProps) {
  const isIcon = variant === "icon";

  return (
    <DeleteConfirmationDialog
      contentType={contentType}
      recordTitle={recordTitle}
      description={
        description ??
        `This will permanently remove the ${contentType} from the CMS and public portfolio. Shared tags, categories, certificates, and uploaded media will not be deleted.`
      }
      confirmLabel={`Delete ${contentType}`}
      onConfirm={onDelete}
      onSuccess={onSuccess}
      trigger={
        <button
          type="button"
          aria-label={isIcon ? label : undefined}
          title={isIcon ? label : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors",
            isIcon
              ? "p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              : "border border-destructive/40 px-3 py-1.5 text-destructive hover:bg-destructive/10",
            className
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {!isIcon && label}
        </button>
      }
    />
  );
}
