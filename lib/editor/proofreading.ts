import { Extension, type Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type ProofreadingTone = "spelling" | "grammar" | "style";

export interface ProofreadingIssue {
  id: string;
  from: number;
  to: number;
  message: string;
  shortMessage: string;
  problemText: string;
  replacements: string[];
  ruleId: string;
  category: string;
  tone: ProofreadingTone;
}

interface ProofreadingSegment {
  plainFrom: number;
  plainTo: number;
  docFrom: number;
}

export interface ProofreadingSource {
  text: string;
  segments: ProofreadingSegment[];
}

interface ProofreadingMeta {
  type: "set" | "clear";
  issues?: ProofreadingIssue[];
}

const proofreadingPluginKey = new PluginKey<DecorationSet>("cmsProofreading");
const skippedBlockTypes = new Set(["codeBlock", "commandBlock", "mermaid"]);
const skippedMarkTypes = new Set(["code", "link"]);

function issueStyle(tone: ProofreadingTone) {
  const color =
    tone === "spelling"
      ? "var(--vermilion)"
      : tone === "style"
        ? "var(--cobalt)"
        : "var(--signal-yellow)";

  return [
    "text-decoration-line: underline",
    "text-decoration-style: wavy",
    `text-decoration-color: ${color}`,
    "text-decoration-thickness: 1.5px",
    "text-underline-offset: 3px",
    "cursor: pointer",
  ].join("; ");
}

function createDecorations(doc: ProseMirrorNode, issues: ProofreadingIssue[]) {
  const decorations = issues.flatMap((issue) => {
    if (issue.from < 1 || issue.to <= issue.from || issue.to > doc.content.size + 1) {
      return [];
    }

    return [
      Decoration.inline(issue.from, issue.to, {
        "data-proofreading-id": issue.id,
        "data-proofreading-tone": issue.tone,
        style: issueStyle(issue.tone),
      }),
    ];
  });

  return DecorationSet.create(doc, decorations);
}

export const ProofreadingExtension = Extension.create({
  name: "cmsProofreading",

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: proofreadingPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, current, _oldState, newState) {
            const meta = transaction.getMeta(proofreadingPluginKey) as
              | ProofreadingMeta
              | undefined;

            if (meta?.type === "clear") return DecorationSet.empty;
            if (meta?.type === "set") {
              return createDecorations(newState.doc, meta.issues ?? []);
            }

            return transaction.docChanged
              ? current.map(transaction.mapping, transaction.doc)
              : current;
          },
        },
        props: {
          decorations(state) {
            return proofreadingPluginKey.getState(state) ?? null;
          },
        },
      }),
    ];
  },
});

export function setProofreadingDecorations(
  editor: Editor,
  issues: ProofreadingIssue[],
) {
  editor.view.dispatch(
    editor.state.tr.setMeta(proofreadingPluginKey, { type: "set", issues } satisfies ProofreadingMeta),
  );
}

export function clearProofreadingDecorations(editor: Editor) {
  editor.view.dispatch(
    editor.state.tr.setMeta(proofreadingPluginKey, { type: "clear" } satisfies ProofreadingMeta),
  );
}

function shouldSkipTextNode(node: ProseMirrorNode) {
  if (node.marks.some((mark) => skippedMarkTypes.has(mark.type.name))) return true;
  const text = node.text?.trim() ?? "";
  return /^(?:https?:\/\/|www\.)\S+$/i.test(text);
}

/**
 * Converts the editable prose into one plain-text document while retaining a
 * position map back to the ProseMirror document. Technical blocks and inline
 * code/links are intentionally omitted to avoid noisy proofreading results.
 */
export function buildProofreadingSource(doc: ProseMirrorNode): ProofreadingSource {
  let text = "";
  const segments: ProofreadingSegment[] = [];

  doc.descendants((node, position) => {
    if (skippedBlockTypes.has(node.type.name)) return false;
    if (node.type.name !== "paragraph" && node.type.name !== "heading") return true;

    let blockText = "";
    const blockSegments: ProofreadingSegment[] = [];

    node.descendants((child, relativePosition) => {
      if (child.type.name === "hardBreak") {
        blockText += " ";
        return false;
      }

      if (!child.isText || !child.text) return true;
      if (shouldSkipTextNode(child)) {
        if (blockText && !blockText.endsWith(" ")) blockText += " ";
        return false;
      }

      const plainFrom = blockText.length;
      blockText += child.text;
      blockSegments.push({
        plainFrom,
        plainTo: blockText.length,
        docFrom: position + 1 + relativePosition,
      });
      return false;
    });

    if (!blockText.trim()) return false;

    if (text.length) text += "\n\n";
    const blockOffset = text.length;
    text += blockText;

    for (const segment of blockSegments) {
      segments.push({
        plainFrom: blockOffset + segment.plainFrom,
        plainTo: blockOffset + segment.plainTo,
        docFrom: segment.docFrom,
      });
    }

    return false;
  });

  return { text, segments };
}

export function mapProofreadingRange(
  source: ProofreadingSource,
  plainFrom: number,
  length: number,
) {
  const plainTo = plainFrom + length;
  if (length <= 0 || plainFrom < 0 || plainTo > source.text.length) return null;

  const overlapping = source.segments.filter(
    (segment) => plainFrom < segment.plainTo && plainTo > segment.plainFrom,
  );
  if (!overlapping.length) return null;

  const first = overlapping[0];
  const last = overlapping[overlapping.length - 1];

  // If LanguageTool points into omitted content or one of the paragraph
  // separators, don't guess at a document position.
  if (plainFrom < first.plainFrom || plainTo > last.plainTo) return null;

  const from = first.docFrom + (plainFrom - first.plainFrom);
  const to = last.docFrom + (plainTo - last.plainFrom);
  if (to <= from) return null;

  return { from, to };
}
