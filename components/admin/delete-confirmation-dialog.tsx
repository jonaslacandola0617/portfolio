"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Loader2, X } from "lucide-react";
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-border bg-surface outline-none data-[state=open]:animate-fade-up"
          onEscapeKeyDown={(event) => pending && event.preventDefault()}
          onPointerDownOutside={(event) => pending && event.preventDefault()}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
        >
          <div className="relative px-6 pb-6 pt-7 sm:px-7">
            <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion">
              <span>Danger</span>
              <span className="h-px w-7 bg-vermilion" aria-hidden="true" />
              <span>Delete</span>
            </div>

            <Dialog.Title
              className="max-w-[460px] text-[26px] font-medium leading-[1.15] text-text sm:text-[30px]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {heading}
            </Dialog.Title>
            <Dialog.Description className="mt-2 max-w-[460px] text-sm leading-6 text-text-dim">
              This action permanently removes this {count && count > 1 ? "selection" : contentType} from the portfolio.
            </Dialog.Description>

            <Dialog.Close
              disabled={pending}
              aria-label="Close dialog"
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center text-muted transition-colors hover:bg-surface-3 hover:text-text disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="border-y border-border px-6 py-5 sm:px-7">
            <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 border border-border bg-surface-2 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-vermilion" />
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-vermilion">
                  Permanent action
                </p>
                <p className="text-sm leading-6 text-text-dim">{description}</p>
              </div>
            </div>

            {error && (
              <div role="alert" className="mt-3 border-l-2 border-vermilion bg-vermilion-dim px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-vermilion">Delete failed</p>
                <p className="mt-1 text-sm text-text">{error}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
            <Dialog.Close asChild>
              <button
                ref={cancelRef}
                type="button"
                disabled={pending}
                className="min-w-[104px] border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-text-dim transition-colors hover:border-border-strong hover:text-text disabled:opacity-50"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={confirm}
              disabled={pending}
              aria-label={confirmLabel}
              className="flex min-w-[132px] items-center justify-center gap-2 border border-vermilion bg-transparent px-4 py-2.5 text-sm font-medium text-vermilion transition-colors hover:bg-vermilion hover:text-white disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Deleting…" : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
