import { z } from "zod";
import { safeHrefSchema } from "@/lib/validations/url";

const text = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long (max ${max} characters)`);
const optionalText = (max: number) => z.string().trim().max(max).default("");
const tagList = (max: number) => z.array(z.string().trim().min(1).max(60)).max(max).default([]);

export const SECTION_KEYS = ["experience", "labs", "certificates", "skills", "capabilities", "projects", "outside", "writing"] as const;
export type HomepageSectionKey = (typeof SECTION_KEYS)[number];

export const CAPABILITY_ICONS = ["support", "hardware", "network", "security", "code", "design"] as const;

const sectionSchema = z.object({
  visible: z.boolean().default(true),
  kicker: text("Section label", 40),
  title: text("Section title", 140),
  intro: optionalText(600),
});

export const homepageSchema = z.object({
  hero: z.object({
    availabilityRoles: text("Roles you're open to", 120),
    availabilityWhere: optionalText(120),
    availabilityShifts: optionalText(60),
    highlight: text("Highlighted words", 60),
    headline: text("Rest of the headline", 160),
    intro: text("Intro paragraph", 700),
    primaryCtaLabel: text("Button label", 40),
    primaryCtaHref: safeHrefSchema,
  }),
  stats: z.array(z.object({ value: text("Stat value", 16), label: text("Stat label", 60) })).max(4),
  showCertificateStat: z.boolean().default(true),
  experience: z.array(z.object({
    title: text("Job title", 120),
    org: text("Organization", 120),
    place: optionalText(120),
    period: text("Period", 60),
    summary: optionalText(600),
    points: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
    skills: tagList(16),
  })).max(8),
  capabilities: z.array(z.object({
    icon: z.enum(CAPABILITY_ICONS),
    title: text("Card title", 60),
    body: text("Card text", 400),
    linkLabel: text("Link label", 40),
    href: safeHrefSchema,
  })).max(6),
  outside: z.object({
    linkLabel: optionalText(40),
    href: safeHrefSchema.or(z.literal("")).default(""),
    areas: z.array(z.object({
      name: text("Area name", 60),
      body: text("Area description", 300),
      tools: tagList(8),
    })).max(6),
  }),
  aiNote: z.object({
    short: text("Badge text", 40),
    long: text("Explanation", 600),
  }),
  sections: z.object(Object.fromEntries(SECTION_KEYS.map((key) => [key, sectionSchema])) as Record<HomepageSectionKey, typeof sectionSchema>),
});

export type HomepageContent = z.infer<typeof homepageSchema>;
