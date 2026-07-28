"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UNGROUPED_SKILL_GROUP, cleanSkillGroup, isUngroupedSkillGroup, skillGroupKey } from "@/lib/skill-groups";

export function SkillGroupInput({
  groups,
  defaultValue = UNGROUPED_SKILL_GROUP,
}: {
  groups: string[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState(cleanSkillGroup(defaultValue));
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = useMemo(() => {
    const query = isUngroupedSkillGroup(value) ? "" : value.trim().toLocaleLowerCase();
    return groups
      .filter((group) => group.toLocaleLowerCase().includes(query))
      .filter((group, index, all) => all.findIndex((item) => skillGroupKey(item) === skillGroupKey(group)) === index)
      .slice(0, 8);
  }, [groups, value]);

  return (
    <div className="relative">
      <Input
        id="group"
        name="group"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setActiveIndex(0);
        }}
        onFocus={() => {
          setFocused(true);
          setActiveIndex(0);
        }}
        onKeyDown={(event) => {
          if (!focused || matches.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % matches.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => (index - 1 + matches.length) % matches.length);
          } else if (event.key === "Enter") {
            event.preventDefault();
            setValue(matches[activeIndex]);
            setFocused(false);
          } else if (event.key === "Escape") {
            setFocused(false);
          }
        }}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={focused && matches.length > 0}
        aria-controls="skill-group-suggestions"
        aria-activedescendant={focused && matches.length > 0 ? `skill-group-option-${activeIndex}` : undefined}
      />
      {focused && matches.length > 0 && (
        <div id="skill-group-suggestions" role="listbox" className="absolute z-40 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg">
          {matches.map((group, index) => (
            <button
              key={skillGroupKey(group)}
              type="button"
              role="option"
              id={`skill-group-option-${index}`}
              aria-selected={skillGroupKey(group) === skillGroupKey(value)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setValue(group);
                setFocused(false);
              }}
              className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-accent ${index === activeIndex ? "bg-accent" : ""}`}
            >
              {group}
              {skillGroupKey(group) === skillGroupKey(value) && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">
        Choose an existing group or enter a new one. New Skills default to {UNGROUPED_SKILL_GROUP}.
      </p>
    </div>
  );
}
