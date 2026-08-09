import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const DEFAULT_SOCIAL_IMAGE = new URL("/api/og", siteConfig.siteUrl).toString();

function cleanDescription(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeDateTime(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00Z`;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
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

export function getFirstContentImage(content: unknown): string | undefined {
  return findImage(content);
}

export function buildStaticPageMetadata({
  title,
  description,
  path,
  keywords = [],
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const socialDescription = cleanDescription(description);
  const canonicalUrl = new URL(path, siteConfig.siteUrl).toString();
  const pageKeywords = Array.from(new Set(keywords.filter(Boolean)));

  return {
    title,
    description: socialDescription,
    alternates: { canonical: path },
    keywords: pageKeywords.length ? pageKeywords : undefined,
    openGraph: {
      type: "website",
      title,
      description: socialDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "en_US",
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE,
          width: 1200,
          height: 630,
          alt: `${title} — ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: socialDescription,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
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
  const socialTags = Array.from(new Set(tags.filter(Boolean)));
  const socialImage = image ?? DEFAULT_SOCIAL_IMAGE;
  const images = [
    {
      url: socialImage,
      alt: image ? `${title} — ${typeLabel}` : `${siteConfig.name} portfolio mark`,
    },
  ];

  return {
    title,
    description: socialDescription,
    alternates: {
      canonical: path,
    },
    keywords: socialTags.length ? socialTags : undefined,
    openGraph: {
      type: "article",
      title,
      description: socialDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: "en_US",
      images,
      publishedTime: normalizeDateTime(publishedTime),
      modifiedTime: normalizeDateTime(modifiedTime),
      section: typeLabel,
      tags: socialTags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: socialDescription,
      images: [socialImage],
    },
  };
}
