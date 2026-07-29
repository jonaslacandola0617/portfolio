"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeleteResult } from "@/types/admin";

interface DeleteConfirmationDialogProps {
  trigger: React.ReactNode;
  contentType: string;
  recordTitle?: string;
  count?: number;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<DeleteResult>;
  onSuccess: () => void;
}

export function DeleteConfirmationDialog({
  trigger,
  contentType,
  recordTitle,
  count,
  description,
  confirmLabel,
  onConfirm,
  onSuccess,
}: DeleteConfirmationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const handleOpenChange = (next: boolean) => {
    if (pending) return;
    setOpen(next);
    if (!next) setError(null);
  };

  const confirm = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await onConfirm();
      if (!result.success) {
        setError(result.message ?? "The item could not be deleted. Try again.");
        return;
      }
      setOpen(false);
      onSuccess();
    } catch {
      setError("The item could not be deleted. Try again.");
    } finally {
      setPending(false);
    }
  };

  const heading = count
    ? `Delete ${count} ${contentType}${count === 1 ? "" : "s"}?`
    : `Delete “${recordTitle}”?`;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card shadow-2xl outline-none"
          onEscapeKeyDown={(event) => {
            if (pending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (pending) event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-destructive/35 bg-destructive/5">
                <AlertTriangle
                  className="h-5 w-5 text-destructive"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 pr-6">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-destructive">
                  Delete {count ? `${count} ` : ""}
                  {contentType}
                  {count && count !== 1 ? "s" : ""}
                </p>
                <Dialog.Title className="mt-2 break-words font-display text-lg font-semibold text-foreground">
                  {heading}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </Dialog.Description>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <button
                  ref={cancelRef}
                  type="button"
                  disabled={pending}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                aria-busy={pending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {pending ? "Deleting..." : confirmLabel}
              </button>
            </div>
          </div>
          <Dialog.Close
            disabled={pending}
            aria-label="Close delete confirmation"
            className={cn(
              "absolute right-4 top-4 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pending && "pointer-events-none opacity-40",
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
