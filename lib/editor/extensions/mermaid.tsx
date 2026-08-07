import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { Waypoints } from "lucide-react";
import { MermaidDiagram } from "@/components/shared/mermaid-diagram";

function MermaidNodeView({ node, updateAttributes }: NodeViewProps) {
  const [showSource, setShowSource] = useState(false);
  const chart: string = node.attrs.chart ?? "";

  return (
    <NodeViewWrapper className="my-3 overflow-hidden border border-border bg-surface-2" data-drag-handle>
      <div className="flex items-center justify-between border-b border-border bg-surface-3 px-4 py-2">
        <span className="flex items-center gap-2 font-mono text-xs text-text-dim">
          <Waypoints className="h-3.5 w-3.5" /> mermaid diagram
        </span>
        <button
          onClick={() => setShowSource((v) => !v)}
          className="font-mono text-[0.65rem] text-cobalt hover:underline"
        >
          {showSource ? "Preview" : "Edit source"}
        </button>
      </div>
      {showSource ? (
        <textarea
          value={chart}
          onChange={(e) => updateAttributes({ chart: e.target.value })}
          rows={8}
          placeholder={"graph LR\n  A --> B"}
          className="w-full resize-y bg-transparent p-4 font-mono text-[0.8rem] leading-6 text-text/90 focus:outline-none"
        />
      ) : chart.trim() ? (
        <MermaidDiagram chart={chart} />
      ) : (
        <p className="p-4 text-sm text-text-dim">
          No diagram source yet — click &ldquo;Edit source&rdquo; to write one.
        </p>
      )}
    </NodeViewWrapper>
  );
}

export const MermaidExtension = Node.create({
  name: "mermaid",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      chart: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "mermaid" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },
});
