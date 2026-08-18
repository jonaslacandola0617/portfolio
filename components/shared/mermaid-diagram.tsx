"use client";

import * as React from "react";
import { Maximize2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      str?: unknown;
      description?: unknown;
    };

    for (const value of [candidate.message, candidate.str, candidate.description]) {
      if (typeof value === "string" && value.trim()) return value;
    }
  }

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

/**
 * The regular diagram and the enlarged diagram briefly exist in the DOM at
 * the same time while the lightbox is open. Mermaid SVGs can contain IDs for
 * markers, clip paths, labels, and other internal references. Duplicate IDs
 * can make one SVG accidentally resolve an arrow/clip path from the other.
 * Scope every ID in the enlarged copy so each SVG remains self-contained.
 */
function scopeSvgIds(svg: string, prefix: string) {
  const ids = Array.from(svg.matchAll(/\bid=(?:"([^"]+)"|'([^']+)')/g))
    .map((match) => match[1] ?? match[2])
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.length - a.length);

  let scoped = svg;
  for (const id of ids) {
    const scopedId = `${prefix}-${id}`;
    scoped = scoped
      .replaceAll(`id="${id}"`, `id="${scopedId}"`)
      .replaceAll(`id='${id}'`, `id='${scopedId}'`)
      .replaceAll(`#${id}`, `#${scopedId}`);
  }

  return scoped;
}

/**
 * Mermaid's block-diagram renderer currently JSON.stringify()s its internal
 * block tree for a debug statement. That tree can contain live HTMLElements.
 * React adds enumerable __reactFiber / __reactProps fields to those elements,
 * which makes JSON.stringify walk into React's circular Fiber graph and throw.
 *
 * A toJSON hook on HTMLElement prevents that traversal. Keep the workaround
 * scoped to the serialized Mermaid block render and restore the prototype
 * immediately afterwards so normal application behavior is unchanged.
 *
 * Upstream Mermaid bugs:
 * - mermaid-js/mermaid#5530
 * - mermaid-js/mermaid#7907
 */
async function withBlockDiagramReactSerializationGuard<T>(
  task: () => Promise<T>,
): Promise<T> {
  const prototype = HTMLElement.prototype;
  const previousDescriptor = Object.getOwnPropertyDescriptor(prototype, "toJSON");

  Object.defineProperty(prototype, "toJSON", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: function mermaidHTMLElementToJSON() {
      return "[HTMLElement]";
    },
  });

  try {
    return await task();
  } finally {
    if (previousDescriptor) {
      Object.defineProperty(prototype, "toJSON", previousDescriptor);
    } else {
      delete (prototype as typeof prototype & { toJSON?: () => unknown }).toJSON;
    }
  }
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [rendering, setRendering] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);
  const renderGeneration = React.useRef(0);
  const instanceId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { resolvedTheme } = useTheme();

  const expandedSvg = React.useMemo(
    () => (svg ? scopeSvgIds(svg, `mermaid-expanded-${instanceId}`) : ""),
    [instanceId, svg],
  );

  React.useEffect(() => {
    const source = normalizeMermaidSource(chart);
    const isBlockDiagram = /^block(?=\s|$)/i.test(source);
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

        host = createRenderHost(source);
        host.id = `mermaid-host-${generation}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;

        const runMermaid = () =>
          mermaid.run({
            nodes: [host!],
            suppressErrors: false,
          });

        if (isBlockDiagram) {
          await withBlockDiagramReactSerializationGuard(runMermaid);
        } else {
          await runMermaid();
        }

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
    <div className="my-5 overflow-x-auto border border-border bg-surface-2">
      {svg ? (
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="group relative block min-w-full cursor-zoom-in p-6 text-left outline-none transition-colors hover:bg-surface-3/40 focus-visible:bg-surface-3/40 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-cobalt"
              aria-label="Open Mermaid diagram in larger view"
            >
              <div
                className="min-w-max [&_svg]:h-auto [&_svg]:max-w-none"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <span className="sticky bottom-2 left-[calc(100%-2.5rem)] mt-[-2rem] flex h-8 w-8 items-center justify-center border border-border-strong bg-surface-2/95 text-text-dim opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Maximize2 className="h-3.5 w-3.5" />
              </span>
            </button>
          </DialogTrigger>

          <DialogContent className="w-[96vw] max-w-[1600px] border-border-strong bg-surface-2 p-3 sm:p-4 [&>button]:right-3 [&>button]:top-3 [&>button]:border [&>button]:border-border-strong [&>button]:bg-surface-2 [&>button]:p-2">
            <div className="flex max-h-[90vh] min-h-0 flex-col pt-8">
              <div className="thin-scroll min-h-0 flex-1 overflow-auto bg-ink/20 p-3 sm:p-6">
                <div
                  className="mx-auto min-w-max [&_svg]:h-auto [&_svg]:min-w-full [&_svg]:max-w-none"
                  dangerouslySetInnerHTML={{ __html: expandedSvg }}
                />
              </div>
              <p className="border-t border-border px-2 pt-3 text-center font-mono text-[0.68rem] text-text-dim">
                Scroll horizontally or vertically to inspect large diagrams.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      ) : error ? (
        <div className="space-y-3 p-6" role="alert">
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
        <div className="p-6 font-mono text-xs text-text-dim">Rendering diagram...</div>
      ) : (
        <div className="p-6 font-mono text-xs text-text-dim">No diagram source.</div>
      )}
    </div>
  );
}
