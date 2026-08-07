"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  const className = compact
    ? "flex h-9 w-9 items-center justify-center border border-border text-text-dim transition-colors hover:border-border-strong hover:text-text"
    : "label flex items-center gap-2 border border-border px-3 py-2 transition-colors hover:border-border-strong hover:text-text";

  return (
    <button
      type="button"
      onClick={() => mounted && setTheme(dark ? "light" : "dark")}
      aria-label="Toggle color theme"
      className={className}
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
      {!compact ? <span>{dark ? "Light" : "Dark"}</span> : null}
    </button>
  );
}
