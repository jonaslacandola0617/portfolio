"use client";

import { useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Paperclip,
  Table2,
  Code2,
  GitBranch,
  MessageSquareQuote,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MediaPickerDialog,
  type MediaAttachmentInsert,
  type MediaImageInsert,
} from "@/components/editor/media-picker-dialog";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center text-text-dim transition-colors hover:bg-surface-3 hover:text-text disabled:pointer-events-none disabled:opacity-40",
        active && "bg-surface-3 text-cobalt",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarGroup({ children, last = false }: { children: ReactNode; last?: boolean }) {
  return (
    <span className={cn("flex items-center gap-0.5 pr-2", !last && "border-r border-border")}>
      {children}
    </span>
  );
}

export function EditorToolbar({
  editor,
  media = [],
}: {
  editor: Editor | null;
  media?: AdminMediaItem[];
}) {
  const [picker, setPicker] = useState<"image" | "attachment" | null>(null);
  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = (attrs: MediaImageInsert) => {
    editor
      .chain()
      .focus()
      .insertContentAt(editor.state.selection.to, { type: "mediaImage", attrs })
      .run();
  };

  const insertAttachment = (attrs: MediaAttachmentInsert) => {
    editor
      .chain()
      .focus()
      .insertContentAt(editor.state.selection.to, {
        type: "mediaAttachment",
        attrs,
      })
      .run();
  };

  return (
    <>
      <ToolbarGroup>
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-[13px] w-[13px]" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-[13px] w-[13px]" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={() => setPicker("image")}>
          <ImageIcon className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton label="Insert attachment" onClick={() => setPicker("attachment")}>
          <Paperclip className="h-[13px] w-[13px]" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup last>
        <ToolbarButton
          label="Table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table2 className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton
          label="Mermaid diagram"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({ type: "mermaid", attrs: { chart: "" } })
              .run()
          }
        >
          <GitBranch className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton
          label="Callout"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: "callout",
                attrs: { variant: "info" },
                content: [{ type: "paragraph" }],
              })
              .run()
          }
        >
          <MessageSquareQuote className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton
          label="Command block"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: "commandBlock",
                attrs: { title: "terminal", commands: [] },
              })
              .run()
          }
        >
          <Terminal className="h-[13px] w-[13px]" />
        </ToolbarButton>
      </ToolbarGroup>

      <MediaPickerDialog
        open={picker !== null}
        mode={picker ?? "image"}
        initialMedia={media}
        onOpenChange={(open) => {
          if (!open) setPicker(null);
        }}
        onInsertImage={insertImage}
        onInsertAttachment={insertAttachment}
      />
    </>
  );
}
