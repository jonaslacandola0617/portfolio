import type { TipTapBlockNode, TipTapDoc } from "@/types/tiptap";

/**
 * "Don't present an empty editor" — from the original CMS brief. Each
 * template is a set of H2 section headings matching the structure the
 * public-facing content templates (originally the MDX seed files) always
 * followed, with an empty paragraph under each to write into.
 *
 * Used by lib/services/*-admin-service.ts's create functions instead of
 * a bare empty document.
 */

function heading(text: string): TipTapBlockNode {
  return { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] };
}

function emptyParagraph(): TipTapBlockNode {
  return { type: "paragraph", content: [] };
}

function sectionedDoc(sections: string[]): TipTapDoc {
  return {
    type: "doc",
    content: sections.flatMap((title) => [heading(title), emptyParagraph()]),
  };
}

export const projectTemplate: TipTapDoc = sectionedDoc([
  "Overview",
  "Objectives",
  "Technologies",
  "Skills",
  "Topology",
  "Implementation",
  "Verification",
  "Troubleshooting",
  "Lessons Learned",
]);

export const labTemplate: TipTapDoc = sectionedDoc([
  "Purpose",
  "Devices",
  "Commands",
  "Configuration",
  "Expected Result",
  "Actual Result",
  "Mistakes",
  "Fixes",
  "Lessons Learned",
]);

export const articleTemplate: TipTapDoc = sectionedDoc([
  "Summary",
  "Body",
  "Commands Learned",
  "Key Takeaways",
  "References",
]);

/** Certificates' content field is optional (Json?) — a write-up, not a
 *  required structured document — so it starts genuinely empty rather
 *  than with sections that may not apply. */
export const emptyTemplate: TipTapDoc = { type: "doc", content: [{ type: "paragraph" }] };
