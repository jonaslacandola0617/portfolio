"use client";

import * as React from "react";
import Link from "next/link";
import { Search, FolderGit2, FlaskConical, NotebookPen, Award, CornerDownLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSearch } from "@/hooks/use-search";
import { cn } from "@/lib/utils";

const typeIcon = {
  project: FolderGit2,
  lab: FlaskConical,
  article: NotebookPen,
  certificate: Award,
};

const typeLabel = {
  project: "Project",
  lab: "Lab",
  article: "Journal",
  certificate: "Certificate",
};

export function SearchDialog() {
  const { open, setOpen, index } = useSearch();
  const [query, setQuery] = React.useState("");

  const results = React.useMemo(() => {
    if (!query.trim()) return index.slice(0, 8);
    const q = query.toLowerCase();
    return index
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [query, index]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, labs, journal entries, certificates, tags..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border px-1.5 font-mono text-[0.65rem] text-muted-foreground">
            esc
          </kbd>
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {results.map((item) => {
            const Icon = typeIcon[item.type];
            return (
              <Link
                key={`${item.type}:${item.title}:${item.href}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-start gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.summary}</span>
                </span>
                <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground">
                  {typeLabel[item.type]}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 font-mono text-[0.65rem] text-muted-foreground">
          <span>{index.length} indexed items</span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" /> to open
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
