"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Public-site counterpart to app/admin/(dashboard)/error.tsx — added
 * during the pre-Phase-6 stabilization pass. Renders inside SiteChrome,
 * so header/nav/footer stay visible even when a page's content errors.
 */
export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[public] route error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h1 className="font-display text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        This page hit an unexpected error. You can try again, or head back home.
      </p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground/70">Reference: {error.digest}</p>}
      <div className="mt-2 flex items-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/">Back home</a>
        </Button>
      </div>
    </div>
  );
}
