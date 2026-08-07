"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical, Inbox, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { ActionResult, DeleteResult } from "@/types/admin";
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
  reorderAction?: (ids: string[]) => Promise<ActionResult>;
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
  reorderAction,
}: ManagementListProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [orderedRows, setOrderedRows] = useState(rows);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orderedRows;
    return orderedRows.filter((row) =>
      `${row.title} ${row.meta} ${row.status}`.toLowerCase().includes(normalized),
    );
  }, [query, orderedRows]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((row) => selected.has(row.id));
  const canReorder = Boolean(reorderAction) && !query.trim() && !savingOrder;

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

  async function moveRow(targetId: string) {
    if (!reorderAction || !draggedId || draggedId === targetId || !canReorder) {
      setDraggedId(null);
      setDropId(null);
      return;
    }

    const previous = orderedRows;
    const fromIndex = previous.findIndex((row) => row.id === draggedId);
    const toIndex = previous.findIndex((row) => row.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...previous];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrderedRows(next);
    setDraggedId(null);
    setDropId(null);
    setSavingOrder(true);
    setOrderMessage("Saving order…");

    const result = await reorderAction(next.map((row) => row.id));
    setSavingOrder(false);
    if (!result.success) {
      setOrderedRows(previous);
      setOrderMessage(result.message ?? "Could not save the new order.");
      return;
    }

    setOrderMessage("Order saved");
    router.refresh();
  }

  const gridClass = reorderAction
    ? "sm:grid-cols-[46px_28px_1fr_140px_110px_140px_80px]"
    : "sm:grid-cols-[28px_1fr_140px_110px_140px_80px]";
  const mobileGridClass = reorderAction
    ? "grid-cols-[46px_28px_1fr_auto]"
    : "grid-cols-[28px_1fr_auto]";

  return (
    <div>
      <PageHeader index={index} eyebrow={eyebrow} title={title} />
      <PageShell>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 border border-border bg-surface-2 px-3 py-2 sm:max-w-xs">
            <Search className="h-3.5 w-3.5 text-muted" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOrderMessage(null);
              }}
              placeholder="Search…"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
          </div>
          <div className="flex items-center gap-3">
            {reorderAction && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted" aria-live="polite">
                {query.trim() ? "Clear search to reorder" : orderMessage ?? "Drag to reorder"}
              </span>
            )}
            <Link
              href={newHref}
              className="flex items-center gap-2 border border-border-strong bg-text px-4 py-2 text-sm font-medium text-surface"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </Link>
          </div>
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
            <div className={`hidden items-center gap-3 border-b border-border bg-surface-2 px-4 py-2.5 sm:grid ${gridClass}`}>
              {reorderAction && <span className="label">Order</span>}
              <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} aria-label="Select all" />
              <span className="label">Title</span>
              <span className="label">Category</span>
              <span className="label">Status</span>
              <span className="label">Updated</span>
              <span className="label text-right">Actions</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((row) => {
                const position = orderedRows.findIndex((item) => item.id === row.id) + 1;
                return (
                  <div
                    key={row.id}
                    onDragOver={(event) => {
                      if (!canReorder) return;
                      event.preventDefault();
                      setDropId(row.id);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void moveRow(row.id);
                    }}
                    className={`grid items-center gap-3 px-4 py-3 transition-colors ${mobileGridClass} ${gridClass} ${dropId === row.id && draggedId !== row.id ? "bg-surface-3" : ""}`}
                  >
                    {reorderAction && (
                      <div className="flex items-center gap-1">
                        <span
                          draggable={canReorder}
                          onDragStart={(event) => {
                            if (!canReorder) {
                              event.preventDefault();
                              return;
                            }
                            setDraggedId(row.id);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", row.id);
                          }}
                          onDragEnd={() => {
                            setDraggedId(null);
                            setDropId(null);
                          }}
                          className={`flex h-7 w-5 items-center justify-center text-muted ${canReorder ? "cursor-grab active:cursor-grabbing hover:text-text" : "cursor-not-allowed opacity-50"}`}
                          title={query.trim() ? "Clear search to reorder" : "Drag to change public position"}
                          aria-label={`Drag ${row.title} to reorder`}
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>
                        <span className="idx w-4 text-right">{String(position).padStart(2, "0")}</span>
                      </div>
                    )}
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label={`Select ${row.title}`} />
                    <span className="truncate text-sm font-medium text-text">{row.title}</span>
                    <span className="hidden truncate text-xs text-muted sm:block">{row.meta}</span>
                    <span className="hidden items-center gap-1.5 sm:flex">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot(row.status)}`} />
                      <span className="label">{row.status}</span>
                    </span>
                    <span className="hidden font-mono text-xs text-muted sm:block">{row.updated}</span>
                    <div className={`${reorderAction ? "col-span-4" : "col-span-3"} flex items-center justify-end gap-1 sm:col-span-1`}>
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
                );
              })}
            </div>
          </div>
        )}
      </PageShell>
    </div>
  );
}
