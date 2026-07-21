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
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === "dark" ? "dark" : "neutral",
        securityLevel: "strict",
        fontFamily: "var(--font-jetbrains-mono)",
        themeVariables: {
          primaryColor: "#3D8BFF22",
          primaryBorderColor: "#3D8BFF",
          lineColor: "#475569",
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
    <div className="my-5 overflow-x-auto rounded-lg border border-border bg-card p-6">
      {svg ? (
        <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="font-mono text-xs text-muted-foreground">Rendering diagram...</div>
      )}
    </div>
  );
}
