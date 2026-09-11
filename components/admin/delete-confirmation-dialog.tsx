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
        <Dialog.Overlay className="admin-control-dialog-overlay fixed inset-0 z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="admin-control-danger-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-fade-up"
          onEscapeKeyDown={(event) => pending && event.preventDefault()}
          onPointerDownOutside={(event) => pending && event.preventDefault()}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
        >
          <header className="admin-control-danger-head">
            <div>
              <span>CONTROL / DELETE</span>
              <Dialog.Title>{heading}</Dialog.Title>
              <Dialog.Description className="sr-only">{description}</Dialog.Description>
            </div>
            <Dialog.Close disabled={pending} aria-label="Close dialog" className="admin-control-danger-close">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </header>

          <div className="admin-control-danger-body">
            <AlertTriangle className="h-4 w-4" />
            <p>{description}</p>
          </div>

          {error && <p role="alert" className="admin-control-danger-error">{error}</p>}

          <footer className="admin-control-danger-foot">
            <Dialog.Close asChild>
              <button ref={cancelRef} type="button" disabled={pending} className="admin-control-danger-cancel">
                Cancel
              </button>
            </Dialog.Close>
            <button type="button" onClick={confirm} disabled={pending} aria-label={confirmLabel} className="admin-control-danger-confirm">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Deleting…" : "Delete"}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
