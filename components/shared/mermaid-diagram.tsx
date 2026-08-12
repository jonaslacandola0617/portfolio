"use client";

import * as React from "react";
import { useTheme } from "next-themes";

let renderQueue: Promise<void> = Promise.resolve();

function enqueueMermaidRender<T>(task: () => Promise<T>): Promise<T> {
  const run = renderQueue.then(task, task);
  renderQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function normalizeMermaidSource(source: string) {
  let normalized = source.trim();

  const fenced = normalized.match(/^```(?:mermaid)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenced?.[1]) normalized = fenced[1].trim();

  normalized = normalized.replace(/^block-beta(?=\s|$)/i, "block");

  return normalized;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "Mermaid could not render this diagram.";
}

function createRenderHost(source: string) {
  const host = document.createElement("div");
  host.className = "mermaid";
  host.textContent = source;
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.visibility = "hidden";
  host.style.pointerEvents = "none";
  host.style.width = "max-content";
  host.style.maxWidth = "none";
  document.body.appendChild(host);
  return host;
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

    void enqueueMermaidRender(async () => {
      let host: HTMLDivElement | null = null;

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

        await mermaid.parse(source);

        if (cancelled || generation !== renderGeneration.current) return;

        // Mermaid owns this temporary element completely. Keeping it outside
        // React's rendered tree prevents Mermaid from traversing/cloning a DOM
        // node decorated with React fiber references (which caused the circular
        // JSON error in block diagrams).
        host = createRenderHost(source);
        host.id = `mermaid-host-${generation}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;

        // `run({ nodes })` is Mermaid's recommended integration path for
        // dynamically created diagrams. Rendering is serialized because Mermaid
        // keeps global parser/config state and concurrent React effects can race.
        await mermaid.run({
          nodes: [host],
          suppressErrors: false,
        });

        if (cancelled || generation !== renderGeneration.current) return;

        const rendered = host.innerHTML.trim();
        if (!rendered.includes("<svg")) {
          throw new Error("Mermaid finished without producing an SVG diagram.");
        }

        setSvg(rendered);
        setError(null);
      } catch (renderError) {
        console.error("Mermaid diagram render failed", renderError);
        if (cancelled || generation !== renderGeneration.current) return;
        setSvg("");
        setError(getErrorMessage(renderError));
      } finally {
        host?.remove();
        if (!cancelled && generation === renderGeneration.current) {
          setRendering(false);
        }
      }
    });

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
