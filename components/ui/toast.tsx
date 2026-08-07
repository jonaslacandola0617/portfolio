"use client";

import * as React from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastOptions {
  id?: string;
  duration?: number;
}

interface ToastItem {
  id: string;
  message: string;
  duration: number;
}

interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

function SuccessToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  React.useEffect(() => {
    const timeout = window.setTimeout(
      () => onDismiss(toast.id),
      toast.duration,
    );
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.duration, toast.id]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-full items-start gap-3 border border-teal/30 bg-surface-2 px-4 py-3",
        "text-text motion-safe:animate-fade-in",
      )}
    >
      <CheckCircle2
        className="mt-0.5 h-4 w-4 shrink-0 text-teal"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.65rem] font-medium uppercase tracking-widest text-teal">
          Success
        </p>
        <p className="mt-0.5 text-sm leading-5 text-text">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-text-dim transition-colors hover:bg-surface-3 hover:text-text focus-visible:outline-none focus-visible:border-cobalt"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const success = React.useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = options.id ?? message;
      setToasts((current) => {
        if (current.some((toast) => toast.id === id)) return current;
        return [
          ...current.slice(-2),
          { id, message, duration: options.duration ?? 4000 },
        ];
      });
    },
    [],
  );

  const value = React.useMemo(
    () => ({ success, dismiss }),
    [dismiss, success],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <SuccessToast toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}
