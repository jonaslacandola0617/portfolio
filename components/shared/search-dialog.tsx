"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSearch } from "@/hooks/use-search";

const typeLabel = {
  project: "Work",
  lab: "Labs",
  article: "Journal",
  certificate: "Credentials",
};

export function SearchDialog() {
  const { open, setOpen, index } = useSearch();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return index
      .filter(
        (item) =>
          !q ||
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
      .slice(0, 16);
  }, [query, index]);

  const groups = (Object.keys(typeLabel) as (keyof typeof typeLabel)[])
    .map((type) => ({
      type,
      label: typeLabel[type],
      items: results.filter((result) => result.type === type),
    }))
    .filter((group) => group.items.length);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="public-search-dialog [&>button]:hidden">
        <div className="public-search-dialog-head">
          <div>
            <span>SEARCH /</span>
            <p>Find something I built, tested, or wrote about.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="public-search-input-wrap">
          <Search size={20} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="network, Laravel, NIST, Linux…"
          />
          <kbd>ESC</kbd>
        </div>

        <div className="public-search-results">
          {groups.length === 0 ? (
            <div className="public-search-empty">
              <strong>No match.</strong>
              <p>Try a project, lab, technology, or topic.</p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.type} className="public-search-group">
                <div className="public-search-group-label">{group.label}</div>
                <div>
                  {group.items.map((item, index) => (
                    <Link
                      key={`${item.type}:${item.title}:${item.href}`}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="public-search-result"
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.summary}</p>
                      </div>
                      <ArrowUpRight size={16} />
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="public-search-dialog-foot">
          <span>TYPE TO FILTER</span>
          <span>CLICK A RESULT TO OPEN</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
