"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, GripVertical, Inbox, Loader2, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import type { ActionResult, DeleteResult, HomepageShowcaseResult } from "@/types/admin";
import { AdminCheckbox } from "@/components/admin/admin-checkbox";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import { FormMessage } from "@/components/admin/form-message";
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
  showcase?: {
    selectedIds: string[];
    max: number;
    toggleAction: (id: string, showcased: boolean) => Promise<HomepageShowcaseResult>;
  };
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
  showcase,
}: ManagementListProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [orderedRows, setOrderedRows] = useState(rows);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [showcaseIds, setShowcaseIds] = useState(showcase?.selectedIds ?? []);
  const [showcasePendingId, setShowcasePendingId] = useState<string | null>(null);
  const [showcaseError, setShowcaseError] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orderedRows;
    return orderedRows.filter((row) =>
      `${row.title} ${row.meta} ${row.status}`.toLowerCase().includes(normalized),
    );
  }, [query, orderedRows]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((row) => selected.has(row.id));
  const someFilteredSelected = filtered.some((row) => selected.has(row.id)) && !allFilteredSelected;
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

  async function toggleShowcase(row: ManagementListRow) {
    if (!showcase || showcasePendingId) return;

    const isShowcased = showcaseIds.includes(row.id);
    if (!isShowcased && showcaseIds.length >= showcase.max) {
      setShowcaseError(
        `The homepage showcase already has ${showcase.max} projects. Remove one before adding another.`,
      );
      return;
    }

    setShowcasePendingId(row.id);
    setShowcaseError(null);
    try {
      const result = await showcase.toggleAction(row.id, !isShowcased);
      if (!result.success) {
        setShowcaseError(result.message);
        return;
      }
      setShowcaseIds(result.selectedIds);
      router.refresh();
    } catch {
      setShowcaseError("Could not update the homepage showcase. Try again.");
    } finally {
      setShowcasePendingId(null);
    }
  }

  function showcaseToggle(row: ManagementListRow, mobile = false) {
    if (!showcase) return null;
    const position = showcaseIds.indexOf(row.id);
    const isShowcased = position >= 0;
    const unpublished = row.status.toUpperCase() !== "PUBLISHED";
    const isPending = showcasePendingId === row.id;
    const disabled = Boolean(showcasePendingId) || (unpublished && !isShowcased);
    const label = isShowcased
      ? `Remove ${row.title} from homepage showcase position ${position + 1}`
      : unpublished
        ? `Publish ${row.title} before adding it to the homepage showcase`
        : `Add ${row.title} to the homepage showcase`;

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isShowcased}
        aria-label={label}
        title={unpublished && !isShowcased ? "Publish this project first" : label}
        disabled={disabled}
        onClick={() => void toggleShowcase(row)}
        className={`admin-showcase-toggle ${isShowcased ? "is-selected" : ""} ${mobile ? "is-mobile" : ""}`}
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className={`h-3 w-3 ${isShowcased ? "fill-current" : ""}`} />}
        <span>{isShowcased ? `Showcase ${String(position + 1).padStart(2, "0")}` : unpublished ? "Publish first" : "Showcase"}</span>
      </button>
    );
  }

  const gridClass = reorderAction
    ? "sm:grid-cols-[46px_28px_1fr_140px_110px_140px_80px]"
    : showcase
      ? "sm:grid-cols-[28px_1fr_140px_110px_132px_140px_80px]"
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
            {showcase && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted" aria-live="polite">
                {showcaseIds.length} / {showcase.max} showcased
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

        {showcaseError && (
          <FormMessage variant="error" className="mb-4">{showcaseError}</FormMessage>
        )}

        {filtered.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
            <label className="flex items-center gap-2 text-xs text-text-dim">
              <AdminCheckbox checked={allFilteredSelected} indeterminate={someFilteredSelected} onChange={toggleAll} aria-label="Select all" />
              <span className="label">Select all</span>
            </label>
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
              <AdminCheckbox checked={allFilteredSelected} indeterminate={someFilteredSelected} onChange={toggleAll} aria-label="Select all" />
              <span className="label">Title</span>
              <span className="label">Category</span>
              <span className="label">Status</span>
              {showcase && <span className="label">Homepage</span>}
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
                          className={`hidden h-7 w-5 items-center justify-center text-muted sm:flex ${canReorder ? "cursor-grab active:cursor-grabbing hover:text-text" : "cursor-not-allowed opacity-50"}`}
                          title={query.trim() ? "Clear search to reorder" : "Drag to change public position"}
                          aria-label={`Drag ${row.title} to reorder`}
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>
                        <span className="idx w-4 text-right">{String(position).padStart(2, "0")}</span>
                      </div>
                    )}
                    <AdminCheckbox checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label={`Select ${row.title}`} />
                    <span className="truncate text-sm font-medium text-text">{row.title}</span>
                    <span className="hidden truncate text-xs text-muted sm:block">{row.meta}</span>
                    <span className="hidden items-center gap-1.5 sm:flex">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot(row.status)}`} />
                      <span className="label">{row.status}</span>
                    </span>
                    {showcase && <div className="hidden sm:block">{showcaseToggle(row)}</div>}
                    <span className="hidden font-mono text-xs text-muted sm:block">{row.updated}</span>
                    <div className={`${reorderAction ? "col-span-4" : "col-span-3"} flex items-center justify-end gap-1 sm:col-span-1`}>
                      {showcase && <div className="mr-auto sm:hidden">{showcaseToggle(row, true)}</div>}
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
