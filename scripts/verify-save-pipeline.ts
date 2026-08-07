import assert from "node:assert/strict";
import { serializeTipTapDocument, TipTapSerializationError } from "@/lib/editor/serialize-content";
import { saveContentPayloadSchema } from "@/lib/validations/content";

function assertPlain(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  if (!Array.isArray(value)) assert.equal(Object.getPrototypeOf(value), Object.prototype);
  for (const child of Object.values(value)) assertPlain(child);
}

const prosemirrorAttrs = Object.assign(Object.create(null), { level: 2 });
const source = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: prosemirrorAttrs,
      content: [{ type: "text", text: "Serialization boundary check" }],
    },
  ],
};

const content = serializeTipTapDocument(source);
assertPlain(content);
assert.notEqual(content.content[0], source.content[0]);
assert.equal((content.content[0] as { attrs: { level: number } }).attrs.level, 2);

const payload = { id: "verification-record", content, clientRevision: 7 };
assert.equal(saveContentPayloadSchema.safeParse(payload).success, true);

const unsupportedValues = [
  { name: "Date", value: new Date() },
  { name: "Map", value: new Map([["key", "value"]]) },
  { name: "undefined", value: undefined },
  { name: "function", value: () => undefined },
];

for (const test of unsupportedValues) {
  assert.throws(
    () =>
      serializeTipTapDocument({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: test.value }] }],
      }),
    TipTapSerializationError,
    `${test.name} should be rejected`
  );
}

const circular: Record<string, unknown> = { type: "doc", content: [] };
circular.self = circular;
assert.throws(() => serializeTipTapDocument(circular), TipTapSerializationError);

console.log("Save pipeline verification passed: ProseMirror attrs normalized; unsupported values rejected.");
