import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { Info, TriangleAlert, CircleCheck, OctagonX, Lightbulb } from "lucide-react";

const variantConfig = {
  info: { icon: Info, className: "border-cobalt/30 bg-cobalt-dim text-cobalt" },
  tip: { icon: Lightbulb, className: "border-cobalt/30 bg-cobalt-dim text-cobalt" },
  warning: { icon: TriangleAlert, className: "border-signal/30 bg-signal/5 text-signal" },
  success: { icon: CircleCheck, className: "border-teal/30 bg-teal/5 text-teal" },
  danger: { icon: OctagonX, className: "border-vermilion/30 bg-vermilion/5 text-vermilion" },
} as const;

type Variant = keyof typeof variantConfig;

function CalloutNodeView({ node, updateAttributes }: NodeViewProps) {
  const variant = (node.attrs.variant as Variant) ?? "info";
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <NodeViewWrapper className={`my-3 border px-4 py-3.5 ${config.className}`} data-drag-handle>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <select
          contentEditable={false}
          value={variant}
          onChange={(e) => updateAttributes({ variant: e.target.value })}
          className="border border-current/20 bg-transparent font-mono text-[0.65rem] uppercase tracking-wide"
        >
          {Object.keys(variantConfig).map((v) => (
            <option key={v} value={v} className="text-text">
              {v}
            </option>
          ))}
        </select>
        <input
          contentEditable={false}
          value={node.attrs.title ?? ""}
          onChange={(e) => updateAttributes({ title: e.target.value || null })}
          placeholder="Optional title..."
          className="flex-1 bg-transparent text-sm font-semibold placeholder:opacity-50 focus:outline-none"
        />
      </div>
      <NodeViewContent className="text-sm leading-6" />
    </NodeViewWrapper>
  );
}

export const CalloutExtension = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      variant: { default: "info" },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "callout" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView);
  },
});
