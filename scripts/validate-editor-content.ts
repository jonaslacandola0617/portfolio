/**
 * Editor-contract fixture check — `npm run validate:editor-content`.
 *
 * Added during the pre-Phase-6 stabilization pass (see
 * docs/PRE_PHASE_6_STABILIZATION_REPORT.md) after a real contract
 * mismatch between the toolbar, the editor extensions, the TipTap type
 * contract, and the Zod validator broke autosave in production use.
 *
 * This is deliberately NOT a test framework — just a small repeatable
 * script with one representative JSON fixture per toolbar-producible
 * node/mark, each run through the exact `tiptapDocSchema` the autosave
 * Server Actions use. If a toolbar button can produce a shape this
 * script doesn't cover, or a fixture here starts failing, that's a
 * regression in the editor/type/validator/renderer contract — the same
 * class of bug that caused the original failure.
 *
 * Each fixture is a minimal but REAL shape — copied from what the
 * actual installed TipTap version emits (confirmed by reading the
 * installed @tiptap/extension-* packages' compiled source during the
 * audit), not guessed. In particular:
 *   - codeBlock's `language` fixture uses `null` (toggleCodeBlock() from
 *     the toolbar never sets a language) — the exact case that broke
 *     autosave originally.
 *   - callout's fixture includes both a `title: null` case (the
 *     NodeView's real default) and a `title: "some title"` case.
 *   - table cells hold a paragraph, with real colspan/rowspan/colwidth/
 *     align attrs, not inline text directly.
 */
import { tiptapDocSchema } from "../lib/validations/content";

interface Fixture {
  name: string;
  doc: unknown;
}

const fixtures: Fixture[] = [
  {
    name: "plain paragraph",
    doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] },
  },
  {
    name: "bold / italic / inline code / link marks",
    doc: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "bold", marks: [{ type: "bold" }] },
            { type: "text", text: "italic", marks: [{ type: "italic" }] },
            { type: "text", text: "code", marks: [{ type: "code" }] },
            {
              type: "text",
              text: "link",
              marks: [{ type: "link", attrs: { href: "https://example.com" } }],
            },
          ],
        },
      ],
    },
  },
  {
    name: "heading 2 / heading 3",
    doc: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "H2" }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "H3" }] },
      ],
    },
  },
  {
    name: "blockquote",
    doc: {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [{ type: "paragraph", content: [{ type: "text", text: "quoted" }] }],
        },
      ],
    },
  },
  {
    name: "bullet list / ordered list",
    doc: {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }] },
          ],
        },
        {
          type: "orderedList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "1" }] }] },
          ],
        },
      ],
    },
  },
  {
    name: "task list",
    doc: {
      type: "doc",
      content: [
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [{ type: "paragraph", content: [{ type: "text", text: "todo" }] }],
            },
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [{ type: "paragraph", content: [{ type: "text", text: "done" }] }],
            },
          ],
        },
      ],
    },
  },
  {
    name: "code block — language set",
    doc: {
      type: "doc",
      content: [{ type: "codeBlock", attrs: { language: "bash" }, content: [{ type: "text", text: "ls -la" }] }],
    },
  },
  {
    name: "code block — language null (toggleCodeBlock() from the toolbar, the confirmed original failure case)",
    doc: {
      type: "doc",
      content: [{ type: "codeBlock", attrs: { language: null }, content: [{ type: "text", text: "no language picked" }] }],
    },
  },
  {
    name: "table with real cell attrs",
    doc: {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  attrs: { colspan: 1, rowspan: 1, colwidth: null, align: null },
                  content: [{ type: "paragraph", content: [{ type: "text", text: "Col A" }] }],
                },
                {
                  type: "tableHeader",
                  attrs: { colspan: 1, rowspan: 1, colwidth: null, align: "center" },
                  content: [{ type: "paragraph", content: [{ type: "text", text: "Col B" }] }],
                },
              ],
            },
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  content: [{ type: "paragraph", content: [{ type: "text", text: "cell 1" }] }],
                },
                {
                  type: "tableCell",
                  content: [{ type: "paragraph" }],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: "table cell with no attrs key at all (older seed-migrated data predating this contract fix)",
    doc: {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "legacy" }] }] },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: "callout — with title",
    doc: {
      type: "doc",
      content: [
        {
          type: "callout",
          attrs: { variant: "warning", title: "Heads up" },
          content: [{ type: "paragraph", content: [{ type: "text", text: "be careful" }] }],
        },
      ],
    },
  },
  {
    name: "callout — title null (the NodeView's real default, and what clearing the title field produces)",
    doc: {
      type: "doc",
      content: [
        {
          type: "callout",
          attrs: { variant: "info", title: null },
          content: [{ type: "paragraph", content: [{ type: "text", text: "no title" }] }],
        },
      ],
    },
  },
  {
    name: "command block",
    doc: {
      type: "doc",
      content: [{ type: "commandBlock", attrs: { title: "terminal", commands: ["nmap -sV target"] } }],
    },
  },
  {
    name: "mermaid diagram",
    doc: { type: "doc", content: [{ type: "mermaid", attrs: { chart: "graph LR\n  A --> B" } }] },
  },
  {
    name: "horizontal rule",
    doc: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "above" }] },
        { type: "horizontalRule" },
        { type: "paragraph", content: [{ type: "text", text: "below" }] },
      ],
    },
  },
  {
    name: "hard break (Shift+Enter)",
    doc: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "line one" }, { type: "hardBreak" }, { type: "text", text: "line two" }],
        },
      ],
    },
  },
  {
    name: "empty doc (brand-new content template)",
    doc: { type: "doc", content: [{ type: "paragraph" }] },
  },
];

let failed = 0;

for (const fixture of fixtures) {
  const result = tiptapDocSchema.safeParse(fixture.doc);
  if (result.success) {
    console.log(`  ok   ${fixture.name}`);
  } else {
    failed++;
    console.error(`  FAIL ${fixture.name}`);
    console.error(`       ${result.error.message}`);
  }
}

console.log("");
if (failed > 0) {
  console.error(`${failed}/${fixtures.length} editor-content fixtures failed validation.`);
  console.error("A toolbar-producible shape is not accepted by lib/validations/content.ts — fix the schema (or the toolbar) before shipping.");
  process.exit(1);
} else {
  console.log(`All ${fixtures.length} editor-content fixtures passed validation.`);
}
