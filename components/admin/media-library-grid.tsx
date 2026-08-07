"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MediaCard } from "@/components/admin/media-card";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";

export function MediaLibraryGrid({ media }: { media: AdminMediaItem[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return media;
    return media.filter((item) => `${item.filename} ${item.type}`.toLowerCase().includes(normalized));
  }, [media, query]);

  return (
    <>
      <div className="mt-6 flex max-w-xs items-center gap-2 border border-border bg-surface-2 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media…" className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted" />
      </div>
      {filtered.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((item) => <MediaCard key={item.id} media={item} />)}
        </div>
      ) : (
        <div className="mt-4 border border-dashed border-border py-16 text-center text-sm text-muted">No media matches “{query}”.</div>
      )}
    </>
  );
}
