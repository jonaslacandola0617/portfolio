export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ContentStatus = "completed" | "in-progress" | "planned";

export interface DownloadLink {
  label: string;
  href: string;
  type: "packet-tracer" | "pcap" | "config" | "github" | "pdf" | "zip" | "other";
  description?: string;
  size?: number;
}

export interface ProjectFrontmatter {
  title: string;
  slug: string;
  summary: string;
  category: string;
  difficulty: Difficulty;
  status: ContentStatus;
  tags: string[];
  technologies: string[];
  skills: string[];
  relatedCertification?: string;
  estimatedTime: string;
  completionDate: string;
  lastUpdated: string;
  thumbnail?: string;
  githubUrl?: string;
  downloads?: DownloadLink[];
}

export interface LabFrontmatter {
  title: string;
  slug: string;
  purpose: string;
  date: string;
  status: ContentStatus;
  difficulty: Difficulty;
  tags: string[];
  category: string;
  downloads?: DownloadLink[];
}

export interface ArticleFrontmatter {
  title: string;
  slug: string;
  summary: string;
  date: string;
  tags: string[];
  category: string;
  featured?: boolean;
}

export interface ContentItem<T> {
  frontmatter: T;
  content: string;
  readingTime?: string;
}

/**
 * Same role as ContentItem<T>, for content types that have migrated to
 * Prisma (Project, as of Phase 2). `content` is `unknown` rather than a
 * TipTap-specific type here deliberately — ContentRenderer is the one
 * place that actually trusts and validates its shape (via
 * lib/validations/content.ts), so every other call site is forced to
 * treat it as opaque rather than assume it's well-formed.
 */
export interface DbContentItem<T> {
  recordId: string;
  frontmatter: T;
  content: unknown;
  readingTime: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  status: ContentStatus;
  progressLabel: string;
  progressPercent: number;
  dateStarted: string;
  dateCompleted?: string;
  credentialUrl?: string;
  skills: string[];
  logo: string;
  content?: unknown;
}

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  category: "networking" | "security" | "linux" | "programming" | "milestone";
  tags?: string[];
}

export interface SkillItem {
  name: string;
  level: "learning" | "practiced" | "comfortable";
  relatedProjectSlugs?: string[];
}

export interface SkillCategory {
  category: string;
  icon: string;
  skills: SkillItem[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface GitHubActivity {
  repo: string;
  description: string;
  language: string;
  updatedAt: string;
  url: string;
}
