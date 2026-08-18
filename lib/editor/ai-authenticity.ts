import { Extension, type Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type AuthenticityLevel = "low" | "moderate" | "high";

export interface AIAuthenticityIssue {
  id: string;
  paragraphIndex: number;
  from: number;
  to: number;
  excerpt: string;
  aiPatternScore: number;
  voiceConsistency: number;
  overEditingScore: number;
  level: AuthenticityLevel;
  summary: string;
  reasons: string[];
}

interface AuthenticityMeta {
  type: "set" | "clear";
  issues?: AIAuthenticityIssue[];
}

const authenticityPluginKey = new PluginKey<DecorationSet>("cmsAuthenticity");

function issueStyle(level: AuthenticityLevel) {
  const color =
    level === "high"
      ? "var(--vermilion)"
      : level === "moderate"
        ? "var(--signal-yellow)"
        : "var(--cobalt)";

  return [
    `background: color-mix(in srgb, ${color} 9%, transparent)`,
    `box-shadow: inset 0 -2px 0 color-mix(in srgb, ${color} 75%, transparent)`,
    "cursor: pointer",
  ].join("; ");
}

function createDecorations(doc: ProseMirrorNode, issues: AIAuthenticityIssue[]) {
  const decorations = issues.flatMap((issue) => {
    if (issue.from < 1 || issue.to <= issue.from || issue.to > doc.content.size + 1) {
      return [];
    }

    return [
      Decoration.inline(issue.from, issue.to, {
        "data-authenticity-id": issue.id,
        "data-authenticity-level": issue.level,
        style: issueStyle(issue.level),
      }),
    ];
  });

  return DecorationSet.create(doc, decorations);
}

export const AIAuthenticityExtension = Extension.create({
  name: "cmsAuthenticity",

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: authenticityPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, current, _oldState, newState) {
            const meta = transaction.getMeta(authenticityPluginKey) as
              | AuthenticityMeta
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
            return authenticityPluginKey.getState(state) ?? null;
          },
        },
      }),
    ];
  },
});

export function setAuthenticityDecorations(
  editor: Editor,
  issues: AIAuthenticityIssue[],
) {
  editor.view.dispatch(
    editor.state.tr.setMeta(authenticityPluginKey, {
      type: "set",
      issues,
    } satisfies AuthenticityMeta),
  );
}

export function clearAuthenticityDecorations(editor: Editor) {
  editor.view.dispatch(
    editor.state.tr.setMeta(authenticityPluginKey, { type: "clear" } satisfies AuthenticityMeta),
  );
}
