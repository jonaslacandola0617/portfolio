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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-border-strong bg-surface-2 outline-none data-[state=open]:animate-fade-up"
          onEscapeKeyDown={(event) => pending && event.preventDefault()}
          onPointerDownOutside={(event) => pending && event.preventDefault()}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <Dialog.Title className="font-display text-base font-semibold text-text">{heading}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-text-dim">Permanent removal</Dialog.Description>
            </div>
            <Dialog.Close disabled={pending} aria-label="Close dialog" className="shrink-0 text-muted hover:text-text disabled:opacity-40">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-start gap-3 border border-vermilion/30 bg-vermilion/10 px-3.5 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" />
              <p className="text-sm text-text-dim">{description}</p>
            </div>
            {error && <p role="alert" className="mt-3 border border-vermilion/30 px-3 py-2 text-sm text-vermilion">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <Dialog.Close asChild>
              <button ref={cancelRef} type="button" disabled={pending} className="border border-border px-4 py-2 text-sm text-text-dim hover:text-text disabled:opacity-50">
                Cancel
              </button>
            </Dialog.Close>
            <button type="button" onClick={confirm} disabled={pending} className="flex items-center gap-2 border border-vermilion bg-vermilion px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Deleting…" : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
