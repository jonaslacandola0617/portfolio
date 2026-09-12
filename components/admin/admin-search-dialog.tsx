"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { searchAdminContent, type AdminSearchResult } from "@/lib/services/admin-search-service";

const typeLabel = {
  project: "Project",
  lab: "Lab",
  article: "Journal",
  certificate: "Certificate",
} as const;

export function AdminSearchDialog({ enableShortcuts = true }: { enableShortcuts?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestId = React.useRef(0);
  const router = useRouter();

  React.useEffect(() => {
    if (!enableShortcuts) return;

    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !e.metaKey && !e.ctrlKey)) {
        const target = e.target as HTMLElement | null;
        const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
        if (e.key === "/" && isTyping) return;
        e.preventDefault();
        setOpen((value) => !value);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enableShortcuts]);

  React.useEffect(() => {
    if (!query.trim()) {
      requestId.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const currentRequest = ++requestId.current;
    const timeout = window.setTimeout(async () => {
      try {
        const found = await searchAdminContent(query);
        if (currentRequest !== requestId.current) return;
        setResults(found);
      } catch {
        if (currentRequest !== requestId.current) return;
        setResults([]);
        setError("Search is unavailable right now. Try again.");
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-4 mt-4 flex items-center gap-2 border border-border px-3 py-2 text-left text-xs text-muted transition-colors hover:border-border-strong hover:text-text-dim"
      >
        <Search className="h-[13px] w-[13px]" />
        <span className="flex-1">Search</span>
        {enableShortcuts && <kbd className="border border-border px-1 font-mono text-[10px]">/</kbd>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="admin-control-search-dialog top-20 translate-y-0 max-w-2xl p-0 sm:top-28 [&>button]:hidden">
          <div className="admin-search-heading">
            <span>SEARCH / ADMIN</span>
            <strong>Find content</strong>
          </div>
          <div className="admin-search-input-row">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value.slice(0, 100))}
              maxLength={100}
              placeholder="Search projects, labs, journal, certificates…"
              aria-label="Search admin content"
              aria-busy={loading}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
            <kbd className="hidden sm:inline-block">ESC</kbd>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="admin-search-close sm:hidden"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="admin-search-results thin-scroll max-h-[28rem] overflow-y-auto" aria-live="polite">
            {loading && <p className="admin-search-empty">Searching…</p>}
            {!loading && error && <p className="admin-search-empty is-error">{error}</p>}
            {!loading && !error && query.trim() && results.length === 0 && (
              <p className="admin-search-empty">No results for “{query}”</p>
            )}
            {!loading && !error && results.map((item, index) => (
              <button
                type="button"
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                className="admin-search-result"
              >
                <span className="admin-search-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="admin-search-result-copy">
                  <small>{typeLabel[item.type]}</small>
                  <strong>{item.title}</strong>
                </span>
                <span className={`admin-search-status is-${item.publishStatus.toLowerCase()}`}>
                  {item.publishStatus}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
