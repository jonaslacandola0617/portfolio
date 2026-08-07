"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[public] route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <AlertTriangle className="mb-4 h-6 w-6 text-vermilion" />
      <p className="idx mb-4">Route Error</p>
      <h1 className="font-display text-3xl font-semibold text-text">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-sm text-text-dim">This page hit an unexpected error. Try the route again or return home.</p>
      {error.digest ? <p className="mt-3 font-mono text-[11px] text-muted">Reference: {error.digest}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button onClick={() => reset()} className="border border-border-strong bg-text px-5 py-2.5 text-sm font-medium text-surface">Try again</button>
        <Link href="/" className="border border-border px-5 py-2.5 text-sm font-medium text-text-dim hover:border-border-strong hover:text-text">Back to home</Link>
      </div>
    </div>
  );
}
