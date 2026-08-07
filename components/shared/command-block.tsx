"use client";

import * as React from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CommandBlockProps {
  title?: string;
  commands: string | string[];
}

export function CommandBlock({ title = "terminal", commands }: CommandBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const lines = Array.isArray(commands) ? commands : commands.split("\n").filter(Boolean);

  function handleCopy() {
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-5 overflow-hidden border border-border bg-surface-2">
      <div className="flex items-center justify-between border-b border-border bg-surface-3 px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-xs text-text-dim">
          <Terminal className="h-3.5 w-3.5" />
          {title}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 font-mono text-[0.65rem] text-text-dim transition-colors hover:text-text"
        >
          {copied ? <Check className="h-3 w-3 text-teal" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <div className="overflow-x-auto p-4 font-mono text-[0.85rem] leading-6">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span className="select-none text-cobalt/70">{"$"}</span>
            <span className="text-text/90">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
