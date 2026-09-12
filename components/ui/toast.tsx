"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

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
      className="identity-toast"
    >
      <span className="identity-toast-index" aria-hidden="true">01</span>
      <div className="identity-toast-copy">
        <p><Check aria-hidden="true" /> Saved successfully</p>
        <strong>{toast.message}</strong>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="identity-toast-close"
        aria-label="Dismiss notification"
      >
        <X aria-hidden="true" />
      </button>
      <span className="identity-toast-rule" aria-hidden="true" />
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
        className="identity-toast-region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="identity-toast-item">
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
