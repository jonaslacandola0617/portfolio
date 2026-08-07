"use client";

import * as React from "react";
import { useTheme } from "next-themes";

let idCounter = 0;

export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState<string>("");
  const { resolvedTheme } = useTheme();
  const id = React.useRef(`mermaid-${++idCounter}`);

  React.useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      const styles = getComputedStyle(document.documentElement);
      const token = (name: string) => styles.getPropertyValue(name).trim();
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "strict",
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        themeVariables: {
          background: token("--surface"),
          primaryColor: token("--surface-2"),
          primaryTextColor: token("--text"),
          primaryBorderColor: token("--cobalt"),
          secondaryColor: token("--surface-3"),
          secondaryTextColor: token("--text"),
          secondaryBorderColor: token("--border"),
          tertiaryColor: token("--surface"),
          tertiaryTextColor: token("--text-dim"),
          tertiaryBorderColor: token("--border"),
          lineColor: token("--text-dim"),
          textColor: token("--text"),
          fontSize: "13px",
        },
      });
      try {
        const { svg: rendered } = await mermaid.render(id.current, chart);
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setSvg("");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme]);

  return (
    <div className="my-5 overflow-x-auto border border-border bg-surface-2 p-6">
      {svg ? (
        <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="font-mono text-xs text-text-dim">Rendering diagram...</div>
      )}
    </div>
  );
}
