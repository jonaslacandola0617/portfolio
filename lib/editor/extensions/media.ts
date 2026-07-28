import { Node, mergeAttributes } from "@tiptap/core";

export const MediaImageExtension = Node.create({
  name: "mediaImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      mediaId: { default: null },
      src: { default: null },
      alt: { default: "" },
      caption: { default: null },
      alignment: { default: "center" },
      size: { default: "large" },
    };
  },
  parseHTML() { return [{ tag: "figure[data-media-image]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { caption, ...attrs } = HTMLAttributes;
    return [
      "figure",
      mergeAttributes(attrs, {
        "data-media-image": "",
        class: `media-image media-image--${attrs.alignment} media-image--${attrs.size}`,
      }),
      ["img", { src: attrs.src, alt: attrs.alt }],
      ...(caption ? [["figcaption", {}, caption]] : []),
    ];
  },
});

export const MediaAttachmentExtension = Node.create({
  name: "mediaAttachment",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      mediaId: { default: null },
      url: { default: null },
      displayName: { default: "" },
      description: { default: null },
      fileType: { default: "OTHER" },
      fileSize: { default: 0 },
    };
  },
  parseHTML() { return [{ tag: "div[data-media-attachment]" }]; },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-media-attachment": "",
        class: "media-attachment",
      }),
      HTMLAttributes.displayName,
    ];
  },
});
