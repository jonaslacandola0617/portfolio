import { Callout } from "@/components/shared/callout";
import { CommandBlock } from "@/components/shared/command-block";
import { MermaidDiagram } from "@/components/shared/mermaid-diagram";
import { CodeBlock } from "@/components/shared/code-block";
import { MediaImage } from "@/components/shared/media-image";
import { MediaAttachment } from "@/components/shared/media-attachment";
import { validateTipTapDoc } from "@/lib/validations/content";
import {
  diagnoseTipTapDocument,
  formatContentDiagnostic,
  type ContentRecordContext,
} from "@/lib/content-diagnostics";
import type {
  TipTapBlockNode,
  TipTapDoc,
  TipTapInlineNode,
  TipTapMark,
} from "@/types/tiptap";

/**
 * Read-only renderer for TipTap JSON — a plain recursive function, not a
 * live `@tiptap/react` Editor instance in `editable: false` mode.
 *
 * That's a deliberate refinement of what ARCHITECTURE.md originally
 * described ("editor and renderer share the same extension config").
 * ProseMirror's EditorView is fundamentally DOM-dependent and isn't a
 * natural fit for static generation / Server Components — using it here
 * would mean either losing `generateStaticParams` for project pages or
 * hydrating a full editor instance just to display text. This function
 * gets the same "can't drift from what the schema defines" guarantee a
 * different way: both this renderer and the Phase 4 editor will be
 * built against the same JSON contract in types/tiptap.ts and
 * lib/validations/content.ts — the shared source of truth is the schema,
 * not a shared runtime instance.
 */

function renderMarks(node: TipTapInlineNode, key: number): React.ReactNode {
  if (node.type === "hardBreak") return <br key={key} />;

  let content: React.ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    content = applyMark(mark, content, key);
  }
  return <span key={key}>{content}</span>;
}

function applyMark(mark: TipTapMark, content: React.ReactNode, key: number): React.ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong key={key}>{content}</strong>;
    case "italic":
      return <em key={key}>{content}</em>;
    case "code":
      return <code key={key}>{content}</code>;
    case "link":
      return (
        <a key={key} href={mark.attrs.href} target={mark.attrs.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {content}
        </a>
      );
  }
}

function renderInline(nodes: TipTapInlineNode[] | undefined) {
  return (nodes ?? []).map((n, i) => renderMarks(n, i));
}

function renderBlock(node: TipTapBlockNode, key: number): React.ReactNode {
  switch (node.type) {
    case "heading": {
      const Tag = `h${node.attrs.level}` as keyof JSX.IntrinsicElements;
      return <Tag key={key}>{renderInline(node.content)}</Tag>;
    }

    case "paragraph":
      return <p key={key}>{renderInline(node.content)}</p>;

    case "blockquote":
      return <blockquote key={key}>{node.content.map((n, i) => renderBlock(n, i))}</blockquote>;

    case "horizontalRule":
      return <hr key={key} />;

    case "bulletList":
      return (
        <ul key={key}>
          {node.content.map((li, i) => (
            <li key={i}>{li.content.map((n, j) => renderBlock(n, j))}</li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} start={node.attrs?.start} type={node.attrs?.type ?? undefined}>
          {node.content.map((li, i) => (
            <li key={i}>{li.content.map((n, j) => renderBlock(n, j))}</li>
          ))}
        </ol>
      );

    case "codeBlock":
      return (
        <CodeBlock
          key={key}
          language={node.attrs.language ?? undefined}
          code={(node.content ?? []).map((n) => n.text).join("")}
        />
      );

    case "callout":
      return (
        <Callout key={key} type={node.attrs.variant} title={node.attrs.title ?? undefined}>
          {node.content.map((n, i) => renderBlock(n, i))}
        </Callout>
      );

    case "commandBlock":
      return <CommandBlock key={key} title={node.attrs.title} commands={node.attrs.commands} />;

    case "mermaid":
      return <MermaidDiagram key={key} chart={node.attrs.chart} />;

    case "mediaImage":
      return <MediaImage key={key} {...node.attrs} />;

    case "mediaAttachment":
      return <MediaAttachment key={key} {...node.attrs} />;

    case "table":
      return (
        <table key={key}>
          <tbody>
            {node.content.map((row, i) => (
              <tr key={i}>
                {row.content.map((cell, j) => {
                  // Real TipTap table cells hold block content (usually
                  // one paragraph) — see types/tiptap.ts's
                  // TipTapTableCellNode comment.
                  const cellChildren = cell.content.map((n, k) => renderBlock(n, k));
                  const style = cell.attrs?.align ? { textAlign: cell.attrs.align } : undefined;
                  return cell.type === "tableHeader" ? (
                    <th key={j} colSpan={cell.attrs?.colspan} rowSpan={cell.attrs?.rowspan} style={style}>
                      {cellChildren}
                    </th>
                  ) : (
                    <td key={j} colSpan={cell.attrs?.colspan} rowSpan={cell.attrs?.rowspan} style={style}>
                      {cellChildren}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "taskList":
      return (
        <ul key={key} data-type="taskList" className="task-list">
          {node.content.map((item, i) => (
            <li key={i} data-checked={item.attrs.checked} className="flex items-start gap-2">
              <input type="checkbox" checked={item.attrs.checked} readOnly className="mt-1.5" />
              <div>{item.content.map((n, j) => renderBlock(n, j))}</div>
            </li>
          ))}
        </ul>
      );
  }
}

export function ContentRenderer({
  content,
  context,
}: {
  content: unknown;
  context: ContentRecordContext;
}) {
  const result = validateTipTapDoc(content);

  if (!result.success) {
    console.error(formatContentDiagnostic(context, diagnoseTipTapDocument(content, result.error)));
    return (
      <p className="text-sm text-muted-foreground">
        This content couldn&rsquo;t be rendered — it doesn&rsquo;t match the expected format.
      </p>
    );
  }

  const doc = result.data as TipTapDoc;

  return <div className="prose-docs">{doc.content.map((node, i) => renderBlock(node, i))}</div>;
}
