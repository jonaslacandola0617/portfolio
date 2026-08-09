import { DEFAULT_SOCIAL_IMAGE } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

const personId = `${siteConfig.siteUrl}/#person`;
const websiteId = `${siteConfig.siteUrl}/#website`;

function normalizeDateTime(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00Z`;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
}

function personEntity() {
  return {
    "@type": "Person",
    "@id": personId,
    name: siteConfig.name,
    url: siteConfig.siteUrl,
  };
}

export function buildWebsiteJsonLd({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    url: siteConfig.siteUrl,
    name,
    description,
    publisher: personEntity(),
  };
}

export function buildProfilePageJsonLd({
  name,
  role,
  tagline,
  email,
  githubUrl,
  linkedinUrl,
  profileImageUrl,
  knowsAbout,
}: {
  name: string;
  role: string;
  tagline: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  profileImageUrl?: string;
  knowsAbout: string[];
}) {
  const aboutUrl = `${siteConfig.siteUrl}/about`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${aboutUrl}#profilepage`,
    url: aboutUrl,
    name: `About ${name}`,
    isPartOf: { "@id": websiteId },
    mainEntity: {
      "@type": "Person",
      "@id": personId,
      name,
      jobTitle: role,
      description: tagline,
      url: siteConfig.siteUrl,
      image: profileImageUrl ?? `${siteConfig.siteUrl}/icon.svg`,
      email,
      sameAs: [githubUrl, linkedinUrl].filter(Boolean),
      knowsAbout: Array.from(new Set(knowsAbout.filter(Boolean))),
    },
  };
}

export function buildArticleJsonLd({
  type = "BlogPosting",
  title,
  description,
  path,
  image,
  publishedTime,
  modifiedTime,
  category,
  tags,
}: {
  type?: "BlogPosting" | "TechArticle";
  title: string;
  description: string;
  path: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  category?: string;
  tags?: string[];
}) {
  const url = new URL(path, siteConfig.siteUrl).toString();
  const person = personEntity();

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#article`,
    headline: title,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@id": websiteId },
    image: [image ?? DEFAULT_SOCIAL_IMAGE],
    datePublished: normalizeDateTime(publishedTime),
    ...(modifiedTime ? { dateModified: normalizeDateTime(modifiedTime) } : {}),
    ...(category ? { articleSection: category } : {}),
    ...(tags?.length ? { keywords: Array.from(new Set(tags)).join(", ") } : {}),
    author: person,
    publisher: person,
  };
}
