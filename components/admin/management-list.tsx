"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import type { BulkDeleteResult, DeleteResult } from "@/types/admin";

/**
 * Added during the pre-Phase-6 stabilization pass (Workstream D2-D4) —
 * every admin list page previously rendered each row as a single `<Link>`
 * wrapping the whole row, with no way to delete anything except by
 * opening the record and using its (broken, nested-form) Delete button.
 * This adds a real per-row Delete and checkbox-based bulk Delete without
 * changing the list's visual design — see the six page.tsx files for how
 * this replaces their previous inline row markup one-for-one.
 *
 * The checkbox and Delete button are rendered as *siblings* of the
 * row's `<Link>`, not children of it — an `<a>` containing interactive
 * controls the person might click without intending to navigate is its
 * own kind of usability bug, on top of nested-forms-adjacent semantics
 * a checkbox/button inside an anchor invites.
 */
export interface ManagementListRow {
  id: string;
  title: string;
  subtitle: string;
  badgeLabel?: string;
  badgeVariant?: BadgeProps["variant"];
}

interface ManagementListProps {
  rows: ManagementListRow[];
  basePath: string;
  itemLabelSingular: string;
  itemLabelPlural: string;
  deleteOneAction: (id: string) => Promise<DeleteResult>;
  deleteManyAction: (ids: string[]) => Promise<BulkDeleteResult>;
}

export function ManagementList({
  rows,
  basePath,
  itemLabelSingular,
  itemLabelPlural,
  deleteOneAction,
  deleteManyAction,
}: ManagementListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [bulkError, setBulkError] = useState<string | null>(null);

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    const count = selected.size;
    const noun = count === 1 ? itemLabelSingular : itemLabelPlural;
    if (typeof window !== "undefined" && !window.confirm(`Delete ${count} selected ${noun}? This can't be undone.`)) {
      return;
    }
    setBulkError(null);
    startTransition(async () => {
      const result = await deleteManyAction(Array.from(selected));
      if (result.success) {
        setSelected(new Set());
        router.refresh();
      } else {
        setBulkError(result.message ?? `Couldn't delete the selected ${itemLabelPlural}. Try again.`);
      }
    });
  };

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
          <span className="text-sm text-foreground">{selected.size} selected</span>
          <div className="flex items-center gap-3">
            {bulkError && <span className="text-xs text-destructive">{bulkError}</span>}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isPending}
              aria-disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isPending ? "Deleting..." : "Delete selected"}
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border rounded-lg border border-border">
        <div className="flex items-center gap-3 bg-muted/30 px-4 py-2">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
            aria-label="Select all"
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-xs text-muted-foreground">Select all</span>
        </div>

        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent">
            <input
              type="checkbox"
              checked={selected.has(row.id)}
              onChange={() => toggleOne(row.id)}
              aria-label={`Select ${row.title}`}
              className="h-4 w-4 flex-shrink-0 rounded border-border"
            />
            <Link href={`${basePath}/${row.id}`} className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{row.title}</div>
              <div className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">{row.subtitle}</div>
            </Link>
            {row.badgeLabel && (
              <Badge variant={row.badgeVariant} className="flex-shrink-0">
                {row.badgeLabel}
              </Badge>
            )}
            <DeleteButton
              variant="icon"
              label={`Delete ${row.title}`}
              confirmMessage={`Delete "${row.title}"? This can't be undone.`}
              onDelete={() => deleteOneAction(row.id)}
              onSuccess={() => router.refresh()}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
