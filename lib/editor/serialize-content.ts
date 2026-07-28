import { tiptapDocSchema } from "@/lib/validations/content";
import { diagnoseTipTapDocument } from "@/lib/content-diagnostics";
import type { TipTapDoc } from "@/types/tiptap";

export class TipTapSerializationError extends Error {
  constructor(
    message: string,
    public readonly path: string
  ) {
    super(message);
    this.name = "TipTapSerializationError";
  }
}

function cloneJsonSafe(value: unknown, path: string, seen: WeakSet<object>): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TipTapSerializationError("Numbers must be finite.", path);
    }
    return value;
  }

  if (typeof value !== "object") {
    throw new TipTapSerializationError(`Unsupported ${typeof value} value.`, path);
  }

  if (seen.has(value)) {
    throw new TipTapSerializationError("Circular reference detected.", path);
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const result = value.map((item, index) => cloneJsonSafe(item, `${path}.${index}`, seen));
    seen.delete(value);
    return result;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    const name = prototype?.constructor?.name ?? "unknown";
    throw new TipTapSerializationError(`Unsupported ${name} instance.`, path);
  }

  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new TipTapSerializationError("Symbol-keyed properties are not supported.", path);
  }

  // ProseMirror deliberately creates node/mark attrs with
  // Object.create(null). Copying enumerable data into an object literal
  // is the one normalization boundary before a Server Action call.
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) {
      throw new TipTapSerializationError("Accessor properties are not supported.", `${path}.${key}`);
    }
    result[key] = cloneJsonSafe(descriptor.value, `${path}.${key}`, seen);
  }
  seen.delete(value);
  return result;
}

function assertNormalObjectPrototypes(value: unknown, path = "content"): void {
  if (value === null || typeof value !== "object") return;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TipTapSerializationError("Document still contains a non-plain object.", path);
  }
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);
  for (const [key, child] of entries) {
    assertNormalObjectPrototypes(child, `${path}.${key}`);
  }
}

/**
 * Converts TipTap/ProseMirror output into the plain, validated document
 * contract permitted across React's Server Action serialization boundary.
 */
export function serializeTipTapDocument(editorOutput: unknown): TipTapDoc {
  const plain = cloneJsonSafe(editorOutput, "content", new WeakSet());
  const parsed = tiptapDocSchema.safeParse(plain);
  if (!parsed.success) {
    const diagnostic = diagnoseTipTapDocument(plain, parsed.error);
    throw new TipTapSerializationError(
      `${diagnostic.reason} (${diagnostic.nodeType} at ${diagnostic.path})`,
      diagnostic.path
    );
  }
  assertNormalObjectPrototypes(parsed.data);
  return parsed.data as TipTapDoc;
}
