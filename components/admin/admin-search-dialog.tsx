"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderGit2,
  FlaskConical,
  NotebookPen,
  BadgeCheck,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  searchAdminContent,
  type AdminSearchResult,
} from "@/lib/services/admin-search-service";

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
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
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
        onClick={() => setOpen(true)}
        className="mb-5 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1">Search...</span>
        <kbd className="inline-flex h-5 items-center rounded border border-border px-1.5 font-mono text-[0.65rem]">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, labs, journal, certificates — including drafts..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-thin p-2">
            {loading && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Searching...
              </p>
            )}
            {!loading && query.trim() && results.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
            {results.map((item) => {
              const Icon = typeIcon[item.type];
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 truncate text-foreground">
                    {item.title}
                  </span>
                  <Badge
                    variant={
                      statusVariant[
                        item.publishStatus as keyof typeof statusVariant
                      ]
                    }
                  >
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
