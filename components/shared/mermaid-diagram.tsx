"use client";

import * as React from "react";
import { useTheme } from "next-themes";

function normalizeMermaidSource(source: string) {
  let normalized = source.trim();

  // Be forgiving when source is pasted with a Markdown fence.
  const fenced = normalized.match(/^```(?:mermaid)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenced?.[1]) normalized = fenced[1].trim();

  // Mermaid 11 uses the stable `block` diagram name. Keep older content that
  // used the beta alias working instead of leaving the renderer in an error state.
  normalized = normalized.replace(/^block-beta(?=\s|$)/i, "block");

  return normalized;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "Mermaid could not render this diagram.";
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [rendering, setRendering] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);
  const renderGeneration = React.useRef(0);
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    const source = normalizeMermaidSource(chart);
    const generation = ++renderGeneration.current;
    let cancelled = false;

    setSvg("");
    setError(null);

    if (!source) {
      setRendering(false);
      return () => {
        cancelled = true;
      };
    }

    setRendering(true);

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        if (cancelled || generation !== renderGeneration.current) return;

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

        // A fresh id per render is important in React Strict Mode. Mermaid uses
        // the id for temporary DOM nodes while rendering; reusing one can make
        // overlapping effect runs collide and silently fail.
        const renderId = `mermaid-${generation}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        const result = await mermaid.render(renderId, source);

        if (cancelled || generation !== renderGeneration.current) return;
        setSvg(result.svg);
        setError(null);
      } catch (renderError) {
        // Do not turn a parser/render failure into an infinite-looking
        // "Rendering diagram..." state. Expose the actual Mermaid error so the
        // source can be corrected immediately.
        console.error("Mermaid diagram render failed", renderError);
        if (cancelled || generation !== renderGeneration.current) return;
        setSvg("");
        setError(getErrorMessage(renderError));
      } finally {
        if (!cancelled && generation === renderGeneration.current) {
          setRendering(false);
        }
      }
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme, retryKey]);

  return (
    <div className="my-5 overflow-x-auto border border-border bg-surface-2 p-6">
      {svg ? (
        <div
          className="min-w-max [&_svg]:h-auto [&_svg]:max-w-none"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : error ? (
        <div className="space-y-3" role="alert">
          <div>
            <p className="font-mono text-xs font-semibold text-vermilion">
              Diagram could not be rendered
            </p>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[0.72rem] leading-5 text-text-dim">
              {error}
            </pre>
          </div>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="border border-border-strong px-3 py-1.5 font-mono text-[0.68rem] text-text hover:bg-surface-3"
          >
            Retry render
          </button>
        </div>
      ) : rendering ? (
        <div className="font-mono text-xs text-text-dim">Rendering diagram...</div>
      ) : (
        <div className="font-mono text-xs text-text-dim">No diagram source.</div>
      )}
    </div>
  );
}
