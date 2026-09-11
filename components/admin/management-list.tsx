"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, GripVertical, Inbox, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { ActionResult, DeleteResult } from "@/types/admin";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import { PageHeader, PageShell } from "@/components/shared/page-header";

export interface ManagementListRow {
  id: string;
  title: string;
  meta: string;
  status: string;
  updated: string;
  showcase?: boolean;
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
  showcaseToggleAction?: (id: string, enabled: boolean) => Promise<ActionResult>;
  showcaseLimit?: number;
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
  showcaseToggleAction,
  showcaseLimit = 2,
}: ManagementListProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [orderedRows, setOrderedRows] = useState(rows);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [showcaseSavingId, setShowcaseSavingId] = useState<string | null>(null);
  const [showcaseMessage, setShowcaseMessage] = useState<string | null>(null);
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
  const showcaseCount = orderedRows.filter((row) => row.showcase).length;

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

  async function toggleShowcase(row: ManagementListRow) {
    if (!showcaseToggleAction || showcaseSavingId) return;
    const nextEnabled = !row.showcase;

    if (nextEnabled && row.status.toUpperCase() !== "PUBLISHED") {
      setShowcaseMessage("Publish this project before adding it to the homepage showcase.");
      return;
    }

    if (nextEnabled && showcaseCount >= showcaseLimit) {
      setShowcaseMessage(`Only ${showcaseLimit} projects can be showcased at once. Toggle off one of the current showcase projects first.`);
      return;
    }

    setShowcaseSavingId(row.id);
    setShowcaseMessage(null);
    const result = await showcaseToggleAction(row.id, nextEnabled);
    setShowcaseSavingId(null);

    if (!result.success) {
      setShowcaseMessage(result.message ?? "The homepage showcase could not be updated.");
      return;
    }

    setOrderedRows((current) =>
      current.map((item) => item.id === row.id ? { ...item, showcase: nextEnabled } : item),
    );
    setShowcaseMessage(result.message ?? (nextEnabled ? "Project added to the homepage showcase." : "Project removed from the homepage showcase."));
    router.refresh();
  }

  async function saveOrder(next: ManagementListRow[], previous: ManagementListRow[]) {
    if (!reorderAction) return;

    setOrderedRows(next);
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
    setDraggedId(null);
    setDropId(null);
    await saveOrder(next, previous);
  }

  async function moveRowBy(id: string, offset: -1 | 1) {
    if (!reorderAction || !canReorder) return;

    const previous = orderedRows;
    const fromIndex = previous.findIndex((row) => row.id === id);
    const toIndex = fromIndex + offset;
    if (fromIndex < 0 || toIndex < 0 || toIndex >= previous.length) return;

    const next = [...previous];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    await saveOrder(next, previous);
  }

  const gridClass = showcaseToggleAction
    ? reorderAction
      ? "sm:grid-cols-[46px_28px_1fr_140px_110px_100px_140px_80px]"
      : "sm:grid-cols-[28px_1fr_140px_110px_100px_140px_80px]"
    : reorderAction
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
                setShowcaseMessage(null);
              }}
              placeholder="Search…"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
          </div>
          <div className="flex items-center gap-3">
            {showcaseToggleAction && (
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted sm:inline">
                Showcase {showcaseCount}/{showcaseLimit}
              </span>
            )}
            {reorderAction && (
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted sm:inline" aria-live="polite">
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

        {showcaseToggleAction && showcaseMessage && (
          <div role="status" aria-live="polite" className="mb-4 border border-cobalt/40 bg-cobalt/5 px-3 py-2.5 text-sm text-text-dim">
            {showcaseMessage}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
            <label className="flex items-center gap-2 text-xs text-text-dim">
              <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} aria-label="Select all" />
              <span className="label">Select all</span>
            </label>
            {showcaseToggleAction && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted">Showcase {showcaseCount}/{showcaseLimit}</span>
            )}
            {reorderAction && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted" aria-live="polite">
                {query.trim() ? "Clear search to reorder" : orderMessage ?? "Use arrows to reorder"}
              </span>
            )}
          </div>
        )}

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
              {showcaseToggleAction && <span className="label">Showcase</span>}
              <span className="label">Updated</span>
              <span className="label text-right">Actions</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((row) => {
                const position = orderedRows.findIndex((item) => item.id === row.id) + 1;
                const showcaseDisabled = showcaseSavingId !== null || (!row.showcase && row.status.toUpperCase() !== "PUBLISHED");
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
                          className={`hidden h-7 w-5 items-center justify-center text-muted sm:flex ${canReorder ? "cursor-grab active:cursor-grabbing hover:text-text" : "cursor-not-allowed opacity-50"}`}
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
                    {showcaseToggleAction && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(row.showcase)}
                        disabled={showcaseDisabled}
                        onClick={() => void toggleShowcase(row)}
                        className={`hidden h-5 w-9 items-center border p-[2px] transition-colors sm:flex ${row.showcase ? "border-cobalt bg-cobalt" : "border-border-strong bg-transparent"} disabled:cursor-not-allowed disabled:opacity-40`}
                        title={row.status.toUpperCase() !== "PUBLISHED" && !row.showcase ? "Publish this project before showcasing it" : row.showcase ? "Remove from homepage showcase" : "Add to homepage showcase"}
                        aria-label={`${row.showcase ? "Remove" : "Add"} ${row.title} ${row.showcase ? "from" : "to"} homepage showcase`}
                      >
                        <span className={`block h-3 w-3 bg-surface transition-transform ${row.showcase ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    )}
                    <span className="hidden font-mono text-xs text-muted sm:block">{row.updated}</span>
                    <div className={`${reorderAction ? "col-span-4" : "col-span-3"} flex items-center justify-end gap-1 sm:col-span-1`}>
                      {reorderAction && (
                        <div className="mr-auto flex items-center gap-1 sm:hidden">
                          <button
                            type="button"
                            onClick={() => void moveRowBy(row.id, -1)}
                            disabled={!canReorder || position <= 1}
                            className="flex h-8 w-8 items-center justify-center border border-border text-text-dim disabled:opacity-30"
                            aria-label={`Move ${row.title} up`}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void moveRowBy(row.id, 1)}
                            disabled={!canReorder || position >= orderedRows.length}
                            className="flex h-8 w-8 items-center justify-center border border-border text-text-dim disabled:opacity-30"
                            aria-label={`Move ${row.title} down`}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      {showcaseToggleAction && (
                        <button
                          type="button"
                          disabled={showcaseDisabled}
                          onClick={() => void toggleShowcase(row)}
                          className={`mr-auto flex items-center gap-2 border px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider sm:hidden ${row.showcase ? "border-cobalt text-cobalt" : "border-border text-text-dim"} disabled:opacity-40`}
                        >
                          {row.showcase ? "Showcase on" : "Showcase off"}
                        </button>
                      )}
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
