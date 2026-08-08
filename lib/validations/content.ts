import { z } from "zod";
import { safeHrefSchema, vercelPublicBlobUrlSchema } from "@/lib/validations/url";

/**
 * Mirrors types/tiptap.ts exactly. Two call sites:
 *   1. prisma/seed/index.ts validates the seed script's generated JSON
 *      before writing it to Postgres — catches a malformed conversion at
 *      migration time, not as a broken render six months later.
 *   2. content-renderer.tsx validates content read back from the DB
 *      before rendering it, defensively — a `Json` column has no schema
 *      enforcement at the database level, so this is the actual
 *      boundary where "is this safe to render" gets decided.
 *
 * Recursive schemas need z.lazy() in Zod — the getters below exist for
 * that, not for style.
 */

const markSchema: z.ZodType<any> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({ type: z.literal("code") }),
  z.object({
    type: z.literal("link"),
    attrs: z.object({
      href: safeHrefSchema,
      target: z.string().nullable().optional(),
      rel: z.string().nullable().optional(),
      class: z.string().nullable().optional(),
      title: z.string().nullable().optional(),
    }),
  }),
]);

const textNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  marks: z.array(markSchema).optional(),
});

/** Shift+Enter — no toolbar button, but a normal StarterKit default with
 *  no way to disable it from the keyboard. See types/tiptap.ts. */
const hardBreakNodeSchema = z.object({ type: z.literal("hardBreak") });

const inlineNodeSchema = z.union([textNodeSchema, hardBreakNodeSchema]);

const headingNodeSchema = z.object({
  type: z.literal("heading"),
  attrs: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]) }),
  content: z.array(inlineNodeSchema).optional(),
});

const paragraphNodeSchema = z.object({
  type: z.literal("paragraph"),
  content: z.array(inlineNodeSchema).optional(),
});

/** Toolbar "Quote" button — content is block+, not inline text. */
const blockquoteNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({ type: z.literal("blockquote"), content: z.array(blockNodeSchema) })
);

/** Toolbar "Horizontal rule" button — atomic leaf. */
const horizontalRuleNodeSchema = z.object({ type: z.literal("horizontalRule") });

/** `language` is nullable — see types/tiptap.ts's TipTapCodeBlockNode
 *  comment for why: this was the confirmed root cause of the reported
 *  autosave failure. Text content within a code block is plain text
 *  only (no marks, no hardBreak — ProseMirror code blocks are a single
 *  text-only paragraph-equivalent), so it intentionally still uses
 *  textNodeSchema rather than inlineNodeSchema. */
const codeBlockNodeSchema = z.object({
  type: z.literal("codeBlock"),
  attrs: z.object({ language: z.string().nullable() }),
  content: z.array(textNodeSchema).optional(),
});

const commandBlockNodeSchema = z.object({
  type: z.literal("commandBlock"),
  attrs: z.object({ title: z.string(), commands: z.array(z.string()) }),
});

const mermaidNodeSchema = z.object({
  type: z.literal("mermaid"),
  attrs: z.object({ chart: z.string() }),
});

const mediaImageNodeSchema = z.object({
  type: z.literal("mediaImage"),
  attrs: z.object({
    mediaId: z.string().min(1).max(128),
    src: vercelPublicBlobUrlSchema,
    alt: z.string().trim().min(1, "Image alternative text is required").max(300),
    caption: z.string().max(500).nullable().optional(),
    alignment: z.enum(["left", "center", "right", "wide"]),
    size: z.enum(["small", "medium", "large", "full"]),
  }),
});

const mediaAttachmentNodeSchema = z.object({
  type: z.literal("mediaAttachment"),
  attrs: z.object({
    mediaId: z.string().min(1).max(128),
    url: vercelPublicBlobUrlSchema,
    displayName: z.string().trim().min(1).max(200),
    description: z.string().max(500).nullable().optional(),
    fileType: z.enum(["VIDEO", "PACKET_TRACER", "PCAP", "PDF", "ZIP", "OTHER"]),
    fileSize: z.number().int().positive().max(1_000_000_000),
  }),
});

/** Real attrs confirmed against the installed @tiptap/extension-table —
 *  TipTap always fills these in with defaults on getJSON(), but `.default()`
 *  on each field (and on the attrs object itself) also accepts older
 *  seed-migrated table content that predates this contract fix and never
 *  had an `attrs` key at all. */
const tableCellAttrsSchema = z
  .object({
    colspan: z.number().int().positive().default(1),
    rowspan: z.number().int().positive().default(1),
    colwidth: z.array(z.number()).nullable().default(null),
    align: z.enum(["left", "center", "right", "justify"]).nullable().catch(null).default(null),
  })
  .default({ colspan: 1, rowspan: 1, colwidth: null, align: null });

/** Table cells hold block content (typically one paragraph), not inline
 *  text directly — see types/tiptap.ts's TipTapTableCellNode comment. */
const tableCellNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum(["tableCell", "tableHeader"]),
    attrs: tableCellAttrsSchema.optional(),
    content: z.array(blockNodeSchema),
  })
);

const tableRowNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({ type: z.literal("tableRow"), content: z.array(tableCellNodeSchema) })
);

const tableNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({ type: z.literal("table"), content: z.array(tableRowNodeSchema) })
);

const taskItemNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("taskItem"),
    attrs: z.object({ checked: z.boolean() }),
    content: z.array(blockNodeSchema),
  })
);

const taskListNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({ type: z.literal("taskList"), content: z.array(taskItemNodeSchema) })
);

const blockNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    headingNodeSchema,
    paragraphNodeSchema,
    blockquoteNodeSchema,
    horizontalRuleNodeSchema,
    bulletListNodeSchema,
    orderedListNodeSchema,
    codeBlockNodeSchema,
    calloutNodeSchema,
    commandBlockNodeSchema,
    mermaidNodeSchema,
    mediaImageNodeSchema,
    mediaAttachmentNodeSchema,
    tableNodeSchema,
    taskListNodeSchema,
  ])
);

const listItemNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({ type: z.literal("listItem"), content: z.array(blockNodeSchema) })
);

const bulletListNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({ type: z.literal("bulletList"), content: z.array(listItemNodeSchema) })
);

const orderedListNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("orderedList"),
    attrs: z
      .object({
        start: z.number().int().positive().default(1),
        type: z.enum(["1", "a", "A", "i", "I"]).nullable().default(null),
      })
      .optional(),
    content: z.array(listItemNodeSchema),
  })
);

/** `title` is nullable, not just optional — see types/tiptap.ts's
 *  TipTapCalloutNode comment: the Callout NodeView's attribute default
 *  is `null`, and clearing the title field sets it back to `null`, never
 *  `undefined`, so `getJSON()` never omits this key entirely. */
const calloutNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("callout"),
    attrs: z.object({
      variant: z.enum(["info", "tip", "warning", "success", "danger"]),
      title: z.string().nullable().optional(),
    }),
    content: z.array(blockNodeSchema),
  })
);

export const tiptapDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(blockNodeSchema),
});

export const saveContentPayloadSchema = z.object({
  id: z.string().min(1),
  content: tiptapDocSchema,
  clientRevision: z.number().int().nonnegative(),
});

export function validateTipTapDoc(value: unknown) {
  return tiptapDocSchema.safeParse(value);
}
