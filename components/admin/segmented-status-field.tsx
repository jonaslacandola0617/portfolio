"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type StatusOption = {
  value: string;
  label: string;
};

export function SegmentedStatusField({
  name,
  label,
  value: controlledValue,
  defaultValue,
  options,
  description,
  onValueChange,
  className,
}: {
  name: string;
  label: string;
  value?: string;
  defaultValue?: string;
  options: StatusOption[];
  description?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? options[0]?.value ?? "",
  );
  const value = controlledValue ?? uncontrolledValue;

  const setValue = (nextValue: string) => {
    if (controlledValue === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="label mb-2">{label}</legend>
      {description && (
        <p className="mb-2 -mt-1 text-xs leading-relaxed text-text-dim">
          {description}
        </p>
      )}
      <input type="hidden" name={name} value={value} />
      <div
        role="radiogroup"
        aria-label={label}
        className="grid w-full border border-border-strong bg-surface"
        style={{
          gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option, index) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setValue(option.value)}
              className={cn(
                "min-h-10 px-3 py-2 text-center text-xs font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                index > 0 && "border-l border-border",
                selected
                  ? "bg-text text-surface"
                  : "bg-surface text-text-dim hover:bg-surface-3 hover:text-text",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
