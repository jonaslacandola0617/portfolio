"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { searchTaxonomyAction } from "@/app/admin/(dashboard)/taxonomy/actions";
import type { TaxonomyKind, TaxonomySuggestion } from "@/lib/validations/taxonomy";
import { cn } from "@/lib/utils";

interface CommonProps {
  name: string;
  kind: TaxonomyKind;
  label: string;
  allowCreate?: boolean;
}

function normalized(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function TaxonomyCombobox({
  name,
  kind,
  label,
  defaultValue = "",
  allowCreate = true,
  required,
}: CommonProps & { defaultValue?: string; required?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TaxonomySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await searchTaxonomyAction({ kind, query, limit: 8 });
      setLoading(false);
      if (result.success) {
        setItems(result.items);
        setActiveIndex(0);
        setError(null);
      } else {
        setItems([]);
        setError(result.message);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [kind, open, query]);

  const exact = items.some((item) => normalized(item.name) === normalized(query));
  const select = (next: string) => {
    const clean = next.trim().replace(/\s+/g, " ");
    setValue(clean);
    setQuery(clean);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <input
        aria-label={label}
        aria-controls={listId}
        aria-expanded={open}
        aria-autocomplete="list"
        aria-activedescendant={open && items[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
        role="combobox"
        required={required}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setValue(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && open && items.length) {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % items.length);
          }
          if (event.key === "ArrowUp" && open && items.length) {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + items.length) % items.length);
          }
          if (event.key === "Enter" && open && items[activeIndex]) {
            event.preventDefault();
            select(items[activeIndex].name);
          }
          if (event.key === "Escape") setOpen(false);
        }}
        className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {open && (
        <div id={listId} role="listbox" className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg">
          {loading && <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Searching…</div>}
          {!loading && items.map((item, index) => (
            <button id={`${listId}-option-${index}`} key={item.id} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => select(item.name)} className={cn("flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-accent", index === activeIndex && "bg-accent")}>
              <span>{item.name}{item.detail && <span className="ml-2 text-xs text-muted-foreground">{item.detail}</span>}</span>
              {normalized(item.name) === normalized(value) && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
          {!loading && allowCreate && query.trim() && !exact && (
            <button type="button" role="option" aria-selected={false} onMouseDown={(event) => event.preventDefault()} onClick={() => select(query)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-primary hover:bg-accent">
              <Plus className="h-3.5 w-3.5" />Create “{query.trim()}”
            </button>
          )}
          {error && <p className="px-3 py-2 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function TaxonomyMultiCombobox({
  name,
  kind,
  label,
  defaultValues = [],
  allowCreate = true,
}: CommonProps & { defaultValues?: string[] }) {
  const [selected, setSelected] = useState(() => [...new Map(defaultValues.map((item) => [normalized(item), item])).values()]);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<TaxonomySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const selectedKeys = useMemo(() => new Set(selected.map(normalized)), [selected]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await searchTaxonomyAction({ kind, query, limit: 10 });
      setLoading(false);
      if (result.success) {
        setItems(result.items.filter((item) => !selectedKeys.has(normalized(item.name))));
        setActiveIndex(0);
        setError(null);
      } else {
        setItems([]);
        setError(result.message);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [kind, open, query, selectedKeys]);

  const add = (value: string) => {
    const clean = value.trim().replace(/\s+/g, " ");
    if (!clean || selectedKeys.has(normalized(clean))) return;
    setSelected((current) => [...current, clean]);
    setQuery("");
    setOpen(true);
  };

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected.join(", ")} />
      <div className={cn("flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5", open && "ring-2 ring-ring")}>
        {selected.map((item) => (
          <span key={normalized(item)} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs text-primary">
            {item}<button type="button" aria-label={`Remove ${item}`} onClick={() => setSelected((current) => current.filter((value) => normalized(value) !== normalized(item)))}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input
          aria-label={label}
          aria-controls={listId}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-activedescendant={open && items[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
          role="combobox"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && open && items.length) {
              event.preventDefault();
              setActiveIndex((current) => (current + 1) % items.length);
            }
            if (event.key === "ArrowUp" && open && items.length) {
              event.preventDefault();
              setActiveIndex((current) => (current - 1 + items.length) % items.length);
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (items[activeIndex]) add(items[activeIndex].name);
              else if (allowCreate) add(query);
            }
            if (event.key === "Backspace" && !query && selected.length) setSelected((current) => current.slice(0, -1));
            if (event.key === "Escape") setOpen(false);
          }}
          className="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm outline-none"
        />
      </div>
      {open && (
        <div id={listId} role="listbox" className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg">
          {loading && <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Searching…</div>}
          {!loading && items.map((item, index) => (
            <button id={`${listId}-option-${index}`} key={item.id} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => add(item.name)} className={cn("block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent", index === activeIndex && "bg-accent")}>
              <span>{item.name}</span>{item.detail && <span className="ml-2 text-xs text-muted-foreground">{item.detail}</span>}
            </button>
          ))}
          {!loading && allowCreate && query.trim() && !selectedKeys.has(normalized(query)) && !items.some((item) => normalized(item.name) === normalized(query)) && (
            <button type="button" role="option" aria-selected={false} onMouseDown={(event) => event.preventDefault()} onClick={() => add(query)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-primary hover:bg-accent"><Plus className="h-3.5 w-3.5" />Create “{query.trim()}”</button>
          )}
          {error && <p className="px-3 py-2 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
