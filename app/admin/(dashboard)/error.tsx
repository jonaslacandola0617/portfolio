"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] route error boundary caught", { operation: "render", errorType: error.name, digest: error.digest });
  }, [error]);

  return (
    <div role="alert" className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-4 border border-signal/40 bg-surface-2 px-6 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-signal" />
      <h1 className="font-display text-xl font-semibold text-text">This page could not load</h1>
      <p className="text-sm text-text-dim">The admin shell is still available, but this section could not retrieve its data. Try the request again or return to the dashboard.</p>
      {error.digest && <p className="font-mono text-xs text-muted">Reference: {error.digest}</p>}
      <div className="mt-2 flex items-center gap-3"><Button onClick={() => reset()}>Try again</Button><Button variant="outline" asChild><a href="/admin">Back to dashboard</a></Button></div>
    </div>
  );
}
