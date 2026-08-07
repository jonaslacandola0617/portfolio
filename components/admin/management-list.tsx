"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inbox, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { DeleteResult } from "@/types/admin";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import { PageHeader, PageShell } from "@/components/shared/page-header";

export interface ManagementListRow {
  id: string;
  title: string;
  meta: string;
  status: string;
  updated: string;
}

interface ManagementListProps {
  index: string;
  title: string;
  eyebrow: string;
  rows: ManagementListRow[];
  basePath: string;
  newHref: string;
  itemLabelSingular: string;
  itemLabelPlural: string;
  deleteOneAction: (id: string) => Promise<DeleteResult>;
  deleteManyAction: (ids: string[]) => Promise<DeleteResult>;
}

function statusDot(status: string) {
  return status.toUpperCase() === "PUBLISHED" ? "bg-teal" : "bg-signal";
}

export function ManagementList({
  index,
  title,
  eyebrow,
  rows,
  basePath,
  newHref,
  itemLabelSingular,
  itemLabelPlural,
  deleteOneAction,
  deleteManyAction,
}: ManagementListProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      `${row.title} ${row.meta} ${row.status}`.toLowerCase().includes(normalized),
    );
  }, [query, rows]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((row) => selected.has(row.id));

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((previous) => {
      const next = new Set(previous);
      if (allFilteredSelected) filtered.forEach((row) => next.delete(row.id));
      else filtered.forEach((row) => next.add(row.id));
      return next;
    });
  }

  return (
    <div>
      <PageHeader index={index} eyebrow={eyebrow} title={title} />
      <PageShell>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 border border-border bg-surface-2 px-3 py-2 sm:max-w-xs">
            <Search className="h-3.5 w-3.5 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
          </div>
          <Link
            href={newHref}
            className="flex items-center gap-2 border border-border-strong bg-text px-4 py-2 text-sm font-medium text-surface"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </Link>
        </div>

        {selected.size > 0 && (
          <div className="mb-4">
            <DeleteConfirmationDialog
              contentType={itemLabelSingular}
              count={selected.size}
              description={`This will permanently remove the selected ${itemLabelPlural} from the CMS and public portfolio.`}
              confirmLabel={`Delete ${selected.size}`}
              onConfirm={() => deleteManyAction(Array.from(selected))}
              onSuccess={() => {
                setSelected(new Set());
                router.refresh();
              }}
              trigger={
                <button type="button" className="flex items-center gap-2 border border-vermilion px-3 py-2 text-sm text-vermilion">
                  <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.size})
                </button>
              }
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-border py-20 text-center">
            <Inbox className="h-[22px] w-[22px] text-muted" />
            <p className="text-sm text-text-dim">
              {query ? `No items match “${query}”` : `No ${itemLabelPlural} yet.`}
            </p>
          </div>
        ) : (
          <div className="border border-border">
            <div className="hidden grid-cols-[28px_1fr_140px_110px_140px_80px] items-center gap-3 border-b border-border bg-surface-2 px-4 py-2.5 sm:grid">
              <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} aria-label="Select all" />
              <span className="label">Title</span>
              <span className="label">Category</span>
              <span className="label">Status</span>
              <span className="label">Updated</span>
              <span className="label text-right">Actions</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((row) => (
                <div key={row.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[28px_1fr_140px_110px_140px_80px]">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label={`Select ${row.title}`} />
                  <span className="truncate text-sm font-medium text-text">{row.title}</span>
                  <span className="hidden truncate text-xs text-muted sm:block">{row.meta}</span>
                  <span className="hidden items-center gap-1.5 sm:flex">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDot(row.status)}`} />
                    <span className="label">{row.status}</span>
                  </span>
                  <span className="hidden font-mono text-xs text-muted sm:block">{row.updated}</span>
                  <div className="col-span-3 flex items-center justify-end gap-1 sm:col-span-1">
                    <Link href={`${basePath}/${row.id}`} className="flex h-8 w-8 items-center justify-center border border-border text-text-dim hover:text-text" aria-label={`Edit ${row.title}`}>
                      <Pencil className="h-[13px] w-[13px]" />
                    </Link>
                    <DeleteConfirmationDialog
                      contentType={itemLabelSingular}
                      recordTitle={row.title}
                      description={`This will permanently remove the ${itemLabelSingular} from the CMS and public portfolio.`}
                      confirmLabel={`Delete ${itemLabelSingular}`}
                      onConfirm={() => deleteOneAction(row.id)}
                      onSuccess={() => router.refresh()}
                      trigger={
                        <button type="button" className="flex h-8 w-8 items-center justify-center border border-border text-text-dim hover:border-vermilion hover:text-vermilion" aria-label={`Delete ${row.title}`}>
                          <Trash2 className="h-[13px] w-[13px]" />
                        </button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageShell>
    </div>
  );
}
