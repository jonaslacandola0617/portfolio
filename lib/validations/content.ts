import { z } from "zod";

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
  z.object({ type: z.literal("link"), attrs: z.object({ href: z.string() }) }),
]);

const textNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  marks: z.array(markSchema).optional(),
});

const headingNodeSchema = z.object({
  type: z.literal("heading"),
  attrs: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]) }),
  content: z.array(textNodeSchema).optional(),
});

const paragraphNodeSchema = z.object({
  type: z.literal("paragraph"),
  content: z.array(textNodeSchema).optional(),
});

const codeBlockNodeSchema = z.object({
  type: z.literal("codeBlock"),
  attrs: z.object({ language: z.string() }),
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

const tableCellNodeSchema = z.object({
  type: z.enum(["tableCell", "tableHeader"]),
  content: z.array(textNodeSchema),
});

const tableRowNodeSchema = z.object({
  type: z.literal("tableRow"),
  content: z.array(tableCellNodeSchema),
});

const tableNodeSchema = z.object({
  type: z.literal("table"),
  content: z.array(tableRowNodeSchema),
});

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
    bulletListNodeSchema,
    orderedListNodeSchema,
    codeBlockNodeSchema,
    calloutNodeSchema,
    commandBlockNodeSchema,
    mermaidNodeSchema,
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
  z.object({ type: z.literal("orderedList"), content: z.array(listItemNodeSchema) })
);

const calloutNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("callout"),
    attrs: z.object({
      variant: z.enum(["info", "tip", "warning", "success", "danger"]),
      title: z.string().optional(),
    }),
    content: z.array(blockNodeSchema),
  })
);

export const tiptapDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(blockNodeSchema),
});

export function validateTipTapDoc(value: unknown) {
  return tiptapDocSchema.safeParse(value);
}
