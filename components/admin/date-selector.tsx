"use client";

import { useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match
    ? { year: match[1], month: match[2], day: match[3] }
    : { year: "", month: "", day: "" };
}

export function DateSelector({
  id,
  name,
  label,
  defaultValue = "",
  optional = false,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  optional?: boolean;
}) {
  const initial = parts(defaultValue);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);
  const currentYear = new Date().getUTCFullYear();
  const years = useMemo(
    () =>
      Array.from({ length: currentYear - 1949 }, (_, index) =>
        String(currentYear + 1 - index),
      ),
    [currentYear],
  );
  const dayCount =
    year && month
      ? new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()
      : 31;
  const safeDay = day && Number(day) <= dayCount ? day : "";
  const completeValue =
    year && month && safeDay ? `${year}-${month}-${safeDay}` : "";
  const hasPartialValue = Boolean(year || month || day) && !completeValue;
  const submittedValue = hasPartialValue
    ? "__incomplete_date__"
    : completeValue;

  const clear = () => {
    setYear("");
    setMonth("");
    setDay("");
  };

  return (
    <fieldset className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-medium leading-none text-foreground">
          <span className="font-mono">{label}</span>
          {optional && (
            <span className="ml-1 font-normal text-muted-foreground">
              (optional)
            </span>
          )}
        </legend>
        {optional && (year || month || day) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            aria-label={`Clear ${label}`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <input type="hidden" id={id} name={name} value={submittedValue} />
      <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-2 rounded-md border border-border bg-background p-2">
        <select
          aria-label={`${label} month`}
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="h-9 min-w-0 rounded border border-border bg-card px-2 text-sm text-foreground"
        >
          <option value="">Month</option>
          {months.map((item, index) => (
            <option key={item} value={String(index + 1).padStart(2, "0")}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} day`}
          value={safeDay}
          onChange={(event) => setDay(event.target.value)}
          className="h-9 min-w-0 rounded border border-border bg-card px-2 text-sm text-foreground"
        >
          <option value="">Day</option>
          {Array.from({ length: dayCount }, (_, index) => index + 1).map(
            (item) => (
              <option key={item} value={String(item).padStart(2, "0")}>
                {item}
              </option>
            ),
          )}
        </select>
        <select
          aria-label={`${label} year`}
          value={year}
          onChange={(event) => setYear(event.target.value)}
          className="h-9 min-w-0 rounded border border-border bg-card px-2 text-sm text-foreground"
        >
          <option value="">Year</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <p className="flex min-h-4 items-center gap-1.5 font-mono text-[0.68rem] text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        {hasPartialValue
          ? "Complete all three date fields"
          : completeValue || "No date selected"}
      </p>
    </fieldset>
  );
}
