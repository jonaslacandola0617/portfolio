"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  filename?: string;
  language?: string;
  code: string;
}

export function CodeBlock({ filename, language = "text", code }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-5 overflow-hidden rounded-lg border border-border bg-card">
      {filename && (
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">
          <span>{filename}</span>
          <span className="uppercase">{language}</span>
        </div>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 flex items-center gap-1 rounded border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
        <pre className="overflow-x-auto p-4 pr-16 font-mono text-[0.85rem] leading-6 text-foreground/90">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
