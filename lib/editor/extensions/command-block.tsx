import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Terminal } from "lucide-react";

function CommandBlockNodeView({ node, updateAttributes }: NodeViewProps) {
  const commands: string[] = node.attrs.commands ?? [];

  return (
    <NodeViewWrapper className="my-3 overflow-hidden border border-border bg-surface-2" data-drag-handle>
      <div className="flex items-center gap-2 border-b border-border bg-surface-3 px-4 py-2">
        <Terminal className="h-3.5 w-3.5 text-text-dim" />
        <input
          value={node.attrs.title ?? ""}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          placeholder="terminal"
          className="bg-transparent font-mono text-xs text-text-dim focus:outline-none"
        />
      </div>
      <div className="p-4">
        <textarea
          value={commands.join("\n")}
          onChange={(e) =>
            updateAttributes({ commands: e.target.value.split("\n").filter((line) => line.length > 0) })
          }
          placeholder="One command per line..."
          rows={Math.max(3, commands.length)}
          className="w-full resize-y bg-transparent font-mono text-[0.85rem] leading-6 text-text/90 placeholder:text-text-dim focus:outline-none"
        />
      </div>
    </NodeViewWrapper>
  );
}

export const CommandBlockExtension = Node.create({
  name: "commandBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      title: { default: "terminal" },
      commands: { default: [] as string[] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="command-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "command-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CommandBlockNodeView);
  },
});
