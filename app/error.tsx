"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[public] route error boundary caught:", error);
  }, [error]);

  return (
    <section className="status-page" aria-labelledby="error-title">
      <p className="eyebrow"><span className="eyebrow-index">Error</span>Something went wrong</p>
      <h1 id="error-title">This page didn&apos;t load.</h1>
      <p className="hero-lede">It&apos;s a temporary problem on my side. Try again, or head back home.</p>
      <div className="hero-actions">
        <button type="button" onClick={() => reset()} className="btn btn-solid"><RotateCcw size={15} /> Try again</button>
        <Link href="/" className="btn btn-ghost">Back home</Link>
      </div>
      {error.digest ? <p className="status-page-hint">Reference: <code>{error.digest}</code></p> : null}
    </section>
  );
}
