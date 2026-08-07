"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeleteResult } from "@/types/admin";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";

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
      description={description ?? `This will permanently remove the ${contentType} from the CMS and public portfolio. Shared taxonomy and uploaded media will not be deleted.`}
      confirmLabel={`Delete ${contentType}`}
      onConfirm={onDelete}
      onSuccess={onSuccess}
      trigger={
        <button
          type="button"
          aria-label={isIcon ? label : undefined}
          title={isIcon ? label : undefined}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 border text-sm font-medium transition-colors",
            isIcon
              ? "h-8 w-8 border-border text-text-dim hover:border-vermilion hover:text-vermilion"
              : "h-10 border-vermilion px-3 text-vermilion hover:bg-vermilion/10",
            className,
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {!isIcon && label}
        </button>
      }
    />
  );
}
