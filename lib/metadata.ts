import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import type { TipTapDoc } from "@/types/tiptap";

function cleanDescription(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function findImage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const node = value as {
    type?: unknown;
    attrs?: unknown;
    content?: unknown;
  };

  if (node.type === "mediaImage" && node.attrs && typeof node.attrs === "object") {
    const src = (node.attrs as { src?: unknown }).src;
    if (typeof src === "string" && src.length > 0) return src;
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      const image = findImage(child);
      if (image) return image;
    }
  }

  return undefined;
}

export function getFirstContentImage(content: TipTapDoc): string | undefined {
  return findImage(content);
}

export function buildContentMetadata({
  title,
  description,
  path,
  typeLabel,
  image,
  publishedTime,
  modifiedTime,
  tags = [],
}: {
  title: string;
  description: string;
  path: string;
  typeLabel: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
}): Metadata {
  const socialDescription = cleanDescription(description);
  const canonicalUrl = new URL(path, siteConfig.siteUrl).toString();
  const images = image
    ? [
        {
          url: image,
          alt: `${title} — ${typeLabel}`,
        },
      ]
    : undefined;

  return {
    title,
    description: socialDescription,
    alternates: {
      canonical: path,
    },
    keywords: tags.length ? tags : undefined,
    openGraph: {
      type: "article",
      title,
      description: socialDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "en_US",
      images,
      publishedTime,
      modifiedTime,
      section: typeLabel,
      tags,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: socialDescription,
      images: image ? [image] : undefined,
    },
  };
}
