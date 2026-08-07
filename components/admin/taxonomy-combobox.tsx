"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
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

function useOutsideDismiss(
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>
) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideInteraction = (event: PointerEvent | FocusEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideInteraction);
    document.addEventListener("focusin", handleOutsideInteraction);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideInteraction);
      document.removeEventListener("focusin", handleOutsideInteraction);
    };
  }, [open, setOpen]);

  return rootRef;
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
  const rootRef = useOutsideDismiss(open, setOpen);

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
    <div ref={rootRef} className="relative">
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
        className="flex h-10 w-full border border-border bg-surface px-3 text-sm text-text outline-none focus:border-cobalt"
      />
      {open && (
        <div id={listId} role="listbox" className="absolute z-40 mt-1 max-h-64 w-full overflow-auto border border-border-strong bg-surface-2 p-1">
          {loading && <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-dim"><Loader2 className="h-3 w-3 animate-spin" />Searching…</div>}
          {!loading && items.map((item, index) => (
            <button id={`${listId}-option-${index}`} key={item.id} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => select(item.name)} className={cn("flex w-full items-center justify-between px-3 py-2 text-left text-sm text-text hover:bg-surface-3", index === activeIndex && "bg-surface-3")}>
              <span>{item.name}{item.detail && <span className="ml-2 text-xs text-text-dim">{item.detail}</span>}</span>
              {normalized(item.name) === normalized(value) && <Check className="h-3.5 w-3.5 text-cobalt" />}
            </button>
          ))}
          {!loading && allowCreate && query.trim() && !exact && (
            <button type="button" role="option" aria-selected={false} onMouseDown={(event) => event.preventDefault()} onClick={() => select(query)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-cobalt hover:bg-surface-3">
              <Plus className="h-3.5 w-3.5" />Create “{query.trim()}”
            </button>
          )}
          {error && <p className="px-3 py-2 text-xs text-vermilion">{error}</p>}
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
  const rootRef = useOutsideDismiss(open, setOpen);

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
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={selected.join(", ")} />
      <div className={cn("flex min-h-10 flex-wrap items-center gap-1.5 border border-border bg-surface px-2 py-1.5", open && "border-cobalt")}>
        {selected.map((item) => (
          <span key={normalized(item)} className="inline-flex items-center gap-1 border border-border bg-surface-2 px-2 py-1 text-xs text-text-dim">
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
        <div id={listId} role="listbox" className="absolute z-40 mt-1 max-h-64 w-full overflow-auto border border-border-strong bg-surface-2 p-1">
          {loading && <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-dim"><Loader2 className="h-3 w-3 animate-spin" />Searching…</div>}
          {!loading && items.map((item, index) => (
            <button id={`${listId}-option-${index}`} key={item.id} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => add(item.name)} className={cn("block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-3", index === activeIndex && "bg-surface-3")}>
              <span>{item.name}</span>{item.detail && <span className="ml-2 text-xs text-text-dim">{item.detail}</span>}
            </button>
          ))}
          {!loading && allowCreate && query.trim() && !selectedKeys.has(normalized(query)) && !items.some((item) => normalized(item.name) === normalized(query)) && (
            <button type="button" role="option" aria-selected={false} onMouseDown={(event) => event.preventDefault()} onClick={() => add(query)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-cobalt hover:bg-surface-3"><Plus className="h-3.5 w-3.5" />Create “{query.trim()}”</button>
          )}
          {error && <p className="px-3 py-2 text-xs text-vermilion">{error}</p>}
        </div>
      )}
    </div>
  );
}
