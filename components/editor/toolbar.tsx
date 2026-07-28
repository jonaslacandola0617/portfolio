"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Heading2,
  Heading3,
  Minus,
  Table as TableIcon,
  Terminal,
  Waypoints,
  Undo2,
  Redo2,
  Info,
  ImagePlus,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaPickerDialog, type MediaAttachmentInsert, type MediaImageInsert } from "@/components/editor/media-picker-dialog";
import type { AdminMediaItem } from "@/lib/services/media-admin-service";
import { useState } from "react";
import { EditorTemplateDialog } from "@/components/editor/editor-template-dialog";
import type { ContentTemplate, TemplateContentType } from "@/lib/editor/templates";

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
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border" />;
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
      .insertContentAt(editor.state.selection.to, { type: "mediaAttachment", attrs })
      .run();
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-border bg-card px-2 py-1.5">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Task list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <ListTodo className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Terminal className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Callout"
        onClick={() =>
          editor.chain().focus().insertContent({ type: "callout", attrs: { variant: "info" }, content: [{ type: "paragraph" }] }).run()
        }
      >
        <Info className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Command block"
        onClick={() =>
          editor.chain().focus().insertContent({ type: "commandBlock", attrs: { title: "terminal", commands: [] } }).run()
        }
      >
        <Terminal className="h-4 w-4 opacity-60" />
      </ToolbarButton>
      <ToolbarButton
        label="Mermaid diagram"
        onClick={() => editor.chain().focus().insertContent({ type: "mermaid", attrs: { chart: "" } }).run()}
      >
        <Waypoints className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Insert image" onClick={() => setPicker("image")}>
        <ImagePlus className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Insert downloadable file" onClick={() => setPicker("attachment")}>
        <Paperclip className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
      {contentType && onApplyTemplate && (
        <EditorTemplateDialog
          contentType={contentType}
          hasContent={!editor.isEmpty}
          onApply={onApplyTemplate}
        />
      )}
      <MediaPickerDialog
        open={picker !== null}
        mode={picker ?? "image"}
        initialMedia={media}
        onOpenChange={(open) => { if (!open) setPicker(null); }}
        onInsertImage={insertImage}
        onInsertAttachment={insertAttachment}
      />
    </div>
  );
}
