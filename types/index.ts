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
  liveSiteUrl?: string;
  demoUrl?: string;
  downloads?: DownloadLink[];
}

export interface LabFrontmatter {
  title: string;
  slug: string;
  purpose: string;
  date: string;
  lastUpdated: string;
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
  lastUpdated: string;
  tags: string[];
  category: string;
  featured?: boolean;
  downloads?: DownloadLink[];
}

/**
 * Shared wrapper for Prisma-backed long-form content. `content` is `unknown`
 * deliberately; ContentRenderer validates the TipTap shape at the rendering boundary.
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
  dateStarted?: string;
  dateCompleted?: string;
  credentialUrl?: string;
  skills: string[];
  logo: string;
  logoUrl?: string;
  content?: unknown;
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
