"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, FolderGit2, FlaskConical, NotebookPen, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { searchAdminContent, type AdminSearchResult } from "@/lib/services/admin-search-service";

const typeIcon = {
  project: FolderGit2,
  lab: FlaskConical,
  article: NotebookPen,
  certificate: BadgeCheck,
} as const;

const statusVariant = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "outline",
  SCHEDULED: "warning",
} as const;

export function AdminSearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
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
  }, []);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const found = await searchAdminContent(query);
      setResults(found);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
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
        <kbd className="border border-border px-1 font-mono text-[10px]">/</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border-border-strong bg-surface-2 p-0 sm:top-32 [&>button]:hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, labs, journal, certificates…"
              className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
            <kbd className="hidden border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline-block">ESC</kbd>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-text sm:hidden"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="thin-scroll max-h-96 overflow-y-auto p-2">
            {loading && <p className="px-3 py-8 text-center text-sm text-muted">Searching…</p>}
            {!loading && query.trim() && results.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted">No results for “{query}”</p>
            )}
            {results.map((item) => {
              const Icon = typeIcon[item.type];
              return (
                <button
                  type="button"
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className="flex w-full items-center gap-3 border border-transparent px-3 py-2.5 text-left text-sm transition-colors hover:border-border hover:bg-surface-3"
                >
                  <Icon className="h-4 w-4 shrink-0 text-cobalt" />
                  <span className="flex-1 truncate text-text">{item.title}</span>
                  <Badge variant={statusVariant[item.publishStatus as keyof typeof statusVariant]}>
                    {item.publishStatus}
                  </Badge>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
