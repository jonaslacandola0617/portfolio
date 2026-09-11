"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, FolderGit2, FlaskConical, NotebookPen, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { searchAdminContent, type AdminSearchResult } from "@/lib/services/admin-search-service";

const typeIcon = {
  project: FolderGit2,
  lab: FlaskConical,
  article: NotebookPen,
  certificate: BadgeCheck,
} as const;

const typeLabel = {
  project: "PROJECT",
  lab: "LAB",
  article: "JOURNAL",
  certificate: "CREDENTIAL",
} as const;

export function AdminSearchDialog({ enableShortcuts = true }: { enableShortcuts?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
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
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const found = await searchAdminContent(query);
      setResults(found);
      setLoading(false);
    }, 240);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-control-search-trigger"
      >
        <Search className="h-[13px] w-[13px]" />
        <span className="flex-1">Search control</span>
        {enableShortcuts && <kbd>/</kbd>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="admin-control-search-dialog [&>button]:hidden"
          overlayClassName="admin-control-search-overlay"
        >
          <div className="admin-control-search-head">
            <span className="admin-control-search-kicker">CONTROL / SEARCH</span>
            <div className="admin-control-search-input-row">
              <Search className="h-4 w-4" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find projects, labs, journals, credentials…"
                aria-label="Search admin content"
              />
              <kbd>ESC</kbd>
            </div>
          </div>

          <div className="admin-control-search-results thin-scroll">
            {!query.trim() && !loading && (
              <div className="admin-control-search-empty">
                <span>READY</span>
                <p>Type a title, content type, or status to jump directly into the CMS.</p>
              </div>
            )}
            {loading && (
              <div className="admin-control-search-empty">
                <span>SEARCHING</span>
                <p>Looking across portfolio content…</p>
              </div>
            )}
            {!loading && query.trim() && results.length === 0 && (
              <div className="admin-control-search-empty">
                <span>NO MATCH</span>
                <p>No control records match “{query}”.</p>
              </div>
            )}

            {results.map((item, index) => {
              const Icon = typeIcon[item.type];
              return (
                <button
                  type="button"
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className="admin-control-search-result"
                >
                  <span className="admin-control-search-index">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="admin-control-search-icon" />
                  <span className="admin-control-search-result-copy">
                    <strong>{item.title}</strong>
                    <small>{typeLabel[item.type]}</small>
                  </span>
                  <span className={`admin-control-search-status is-${item.publishStatus.toLowerCase()}`}>
                    {item.publishStatus}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
