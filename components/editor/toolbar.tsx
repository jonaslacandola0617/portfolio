"use client";

import { useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  ListTodo,
  Link2,
  Image as ImageIcon,
  Paperclip,
  Heading2,
  Heading3,
  Quote,
  Table2,
  Code2,
  GitBranch,
  MessageSquareQuote,
  Terminal,
  Minus,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MediaPickerDialog,
  type MediaAttachmentInsert,
  type MediaImageInsert,
} from "@/components/editor/media-picker-dialog";
import { EditorTemplateDialog } from "@/components/editor/editor-template-dialog";
import { LinkDialog } from "@/components/editor/link-dialog";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import type {
  ContentTemplate,
  TemplateContentType,
} from "@/lib/editor/templates";

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
  contentType,
  onApplyTemplate,
}: {
  editor: Editor | null;
  media?: AdminMediaItem[];
  contentType?: TemplateContentType;
  onApplyTemplate?: (template: ContentTemplate) => void;
}) {
  const [picker, setPicker] = useState<"image" | "attachment" | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  if (!editor) return null;

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
        <ToolbarButton
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-[13px] w-[13px]" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-[13px] w-[13px]" />
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
        <ToolbarButton
          label="Task list"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListTodo className="h-[13px] w-[13px]" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={() => setLinkOpen(true)}>
          <Link2 className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={() => setPicker("image")}>
          <ImageIcon className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton label="Insert downloadable file" onClick={() => setPicker("attachment")}>
          <Paperclip className="h-[13px] w-[13px]" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
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
        <ToolbarButton
          label="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-[13px] w-[13px]" />
        </ToolbarButton>
        {contentType && onApplyTemplate && (
          <EditorTemplateDialog
            contentType={contentType}
            hasContent={!editor.isEmpty}
            onApply={onApplyTemplate}
          />
        )}
      </ToolbarGroup>

      <ToolbarGroup last>
        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-[13px] w-[13px]" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-[13px] w-[13px]" />
        </ToolbarButton>
      </ToolbarGroup>

      <LinkDialog editor={editor} open={linkOpen} onOpenChange={setLinkOpen} />

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
