"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSearch } from "@/hooks/use-search";

const typeLabel = {
  lab: "Labs",
  certificate: "Certificates",
  project: "Projects",
  article: "Writing",
  video: "Video",
};

const suggestions = ["VLAN", "Linux", "Cybersecurity", "Active Directory", "Troubleshooting"];

export function SearchDialog() {
  const { open, setOpen, index } = useSearch();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
      .slice(0, 16);
  }, [query, index]);

  const groups = (Object.keys(typeLabel) as (keyof typeof typeLabel)[])
    .map((type) => ({ type, label: typeLabel[type], items: results.filter((result) => result.type === type) }))
    .filter((group) => group.items.length);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent overlayClassName="public-search-overlay" className="public-search-dialog search-dialog [&>button]:hidden">
        <div className="search-input-row">
          <Search size={20} aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search labs, certificates, projects, writing…"
            aria-label="Search the portfolio"
          />
          <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="search-close"><X size={18} /></button>
        </div>

        <div className="search-body">
          {!query.trim() ? (
            <div className="search-empty">
              <p>Try one of these:</p>
              <div className="search-suggestions">
                {suggestions.map((term) => <button key={term} type="button" onClick={() => setQuery(term)}>{term}</button>)}
              </div>
            </div>
          ) : groups.length === 0 ? (
            <div className="search-empty"><strong>No results for “{query.trim()}”.</strong><p>Try a tool, a topic or a project name.</p></div>
          ) : (
            groups.map((group) => (
              <section key={group.type} className="search-group" aria-label={group.label}>
                <p className="search-group-label">{group.label} <span>{group.items.length}</span></p>
                {group.items.map((item) => (
                  <Link key={`${item.type}:${item.title}:${item.href}`} href={item.href} onClick={() => setOpen(false)} className="search-result">
                    <span><strong>{item.title}</strong><small>{item.summary}</small></span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                ))}
              </section>
            ))
          )}
        </div>

        <div className="search-foot"><span><kbd>/</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
      </DialogContent>
    </Dialog>
  );
}
