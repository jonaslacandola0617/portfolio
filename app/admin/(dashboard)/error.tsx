"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Added during the pre-Phase-6 stabilization pass (Workstream C2) — the
 * admin section had no error.tsx, so any uncaught render/data error
 * under /admin/* fell through to Next.js's default unstyled error page,
 * with no way back into the admin UI short of a manual URL edit.
 *
 * error.tsx boundaries must be Client Components — this is a Next.js
 * requirement, not a stylistic choice (the reset() function and error
 * event only exist on the client). It renders inside
 * AdminDashboardLayout, so the sidebar stays visible even when a page
 * errors out.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Client-side console only — this is not a substitute for real
    // server-side logging (see lib/services/action-errors.ts for that),
    // but it's the only visibility available for a render-time error
    // that never reached a Server Action.
    console.error("[admin] route error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h1 className="font-display text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        This part of the admin dashboard hit an unexpected error. It&apos;s been logged. You can try again, or head
        back to the dashboard.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground/70">Reference: {error.digest}</p>
      )}
      <div className="mt-2 flex items-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/admin">Back to dashboard</a>
        </Button>
      </div>
    </div>
  );
}
