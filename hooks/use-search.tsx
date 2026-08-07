"use client";

import * as React from "react";

export interface SearchIndexItem {
  type: "project" | "lab" | "article" | "certificate";
  title: string;
  summary: string;
  href: string;
  tags: string[];
}

interface SearchContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  index: SearchIndexItem[];
}

const SearchContext = React.createContext<SearchContextValue | null>(null);

export function SearchProvider({
  children,
  index,
}: {
  children: React.ReactNode;
  index: SearchIndexItem[];
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (e.key === "/" && (e.target as HTMLElement)?.tagName === "INPUT") return;
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ open, setOpen, index }}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = React.useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within a SearchProvider");
  return ctx;
}
