import "server-only";
import { prisma } from "@/lib/db";
import type { TipTapBlockNode, TipTapDoc } from "@/types/tiptap";

type MediaReference =
  | { kind: "image"; id: string; url: string }
  | { kind: "attachment"; id: string; url: string; fileType: string; fileSize: number };

function collect(nodes: TipTapBlockNode[], references: MediaReference[]) {
  for (const node of nodes) {
    if (node.type === "mediaImage") {
      references.push({ kind: "image", id: node.attrs.mediaId, url: node.attrs.src });
    } else if (node.type === "mediaAttachment") {
      references.push({
        kind: "attachment",
        id: node.attrs.mediaId,
        url: node.attrs.url,
        fileType: node.attrs.fileType,
        fileSize: node.attrs.fileSize,
      });
    } else if (node.type === "blockquote" || node.type === "callout") {
      collect(node.content, references);
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      for (const item of node.content) collect(item.content, references);
    } else if (node.type === "taskList") {
      for (const item of node.content) collect(item.content, references);
    } else if (node.type === "table") {
      for (const row of node.content) {
        for (const cell of row.content) collect(cell.content, references);
      }
    }
  }
}

export async function validateContentMediaReferences(doc: TipTapDoc) {
  const references: MediaReference[] = [];
  collect(doc.content, references);
  if (!references.length) return;
  const ids = [...new Set(references.map((reference) => reference.id))];
  const media = await prisma.media.findMany({
    where: { id: { in: ids } },
    select: { id: true, url: true, type: true, size: true },
  });
  const byId = new Map(media.map((item) => [item.id, item]));
  for (const reference of references) {
    const item = byId.get(reference.id);
    if (!item) throw new Error(`Referenced media ${reference.id} does not exist.`);
    if (item.url !== reference.url) throw new Error(`Referenced media ${reference.id} URL does not match.`);
    if (reference.kind === "image" && item.type !== "IMAGE") {
      throw new Error(`Referenced media ${reference.id} is not an image.`);
    }
    if (reference.kind === "attachment") {
      if (item.type === "IMAGE") throw new Error(`Images must use the image block.`);
      if (item.type !== reference.fileType || item.size !== reference.fileSize) {
        throw new Error(`Referenced attachment metadata does not match the Media Library.`);
      }
    }
  }
}
