import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import {
  Info,
  TriangleAlert,
  CircleCheck,
  OctagonX,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

const variantConfig = {
  info: {
    icon: Info,
    rail: "bg-cobalt",
    iconClass: "text-cobalt",
    label: "Info",
  },
  tip: {
    icon: Lightbulb,
    rail: "bg-cobalt",
    iconClass: "text-cobalt",
    label: "Tip",
  },
  warning: {
    icon: TriangleAlert,
    rail: "bg-signal",
    iconClass: "text-signal",
    label: "Warning",
  },
  success: {
    icon: CircleCheck,
    rail: "bg-teal",
    iconClass: "text-teal",
    label: "Success",
  },
  danger: {
    icon: OctagonX,
    rail: "bg-vermilion",
    iconClass: "text-vermilion",
    label: "Danger",
  },
} as const;

type Variant = keyof typeof variantConfig;

function CalloutNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const variant = ((node.attrs.variant as Variant) in variantConfig
    ? node.attrs.variant
    : "info") as Variant;
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <NodeViewWrapper
      className={cn(
        "relative my-5 border bg-surface-2",
        selected ? "border-cobalt" : "border-border",
      )}
      data-type="callout"
    >
      <span className={cn("absolute bottom-0 left-0 top-0 w-[3px]", config.rail)} />

      <div className="flex flex-wrap items-center gap-3 border-b border-border py-2.5 pl-4 pr-3">
        <Icon className={cn("h-4 w-4 shrink-0", config.iconClass)} />

        <div
          contentEditable={false}
          className="flex flex-wrap items-center gap-px border border-border bg-border"
          aria-label="Callout type"
        >
          {(Object.keys(variantConfig) as Variant[]).map((value) => (
            <button
              key={value}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => updateAttributes({ variant: value })}
              aria-pressed={variant === value}
              className={cn(
                "h-6 bg-surface px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-text",
                variant === value && "bg-text text-surface hover:text-surface",
              )}
            >
              {variantConfig[value].label}
            </button>
          ))}
        </div>

        <input
          contentEditable={false}
          value={node.attrs.title ?? ""}
          onChange={(event) => updateAttributes({ title: event.target.value || null })}
          placeholder="Optional title…"
          aria-label="Callout title"
          className="min-w-[160px] flex-1 border-0 bg-transparent font-display text-sm font-semibold text-text outline-none placeholder:font-normal placeholder:text-muted"
        />
      </div>

      <NodeViewContent className="px-4 py-3 text-sm leading-6 text-text [&>p]:my-0 [&>p+p]:mt-3" />
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
