/**
 * SITE CONFIG
 * ───────────
 * Seed/runtime fallback for identity, links, and the "currently learning" widget.
 */

export const siteConfig = {
  name: "Jonas Lacandola",
  initials: "JL",
  role: "Web Developer · IT Support · Networking & Cybersecurity",
  tagline:
    "I build practical web applications, troubleshoot systems, and document what I learn across software, networking, and security.",
  location:
    "Based in the Philippines · open to remote & on-site web development, IT support, and technical roles",
  email: "jonas.lacandola.sec@protonmail.com",
  social: {
    github: "https://github.com/jonaslacandola-sec",
    linkedin: "https://linkedin.com/in/jonaslacandola-sec",
    twitter: "https://x.com/jonaslacandola-sec",
  },
  resumeUrl: "/resume.pdf",
  siteUrl: "https://www.jonasl.online",
  description:
    "Web development, IT support, networking, and cybersecurity portfolio by Jonas Lacandola — full-stack applications, APIs, technical projects, labs, and documented learning.",

  currentlyLearning: [
    { label: "CCNA — Module 8: Subnetting", href: "/certifications" },
    { label: "Google Cybersecurity — Course 2", href: "/certifications" },
    {
      label: "Static & Default Routing",
      href: "/labs/static-routing-configuration",
    },
    { label: "VLANs & Trunking", href: "/labs/vlan-trunking-lab" },
    {
      label: "Linux command line fundamentals",
      href: "/labs/linux-file-permissions-practice",
    },
  ],

  currentFocusStack: [
    "Laravel",
    "PHP",
    "React",
    "Next.js",
    "TypeScript",
    "SQL",
    "Networking",
    "Cybersecurity",
  ],
} as const;

export const navItems = [
  { label: "Home", href: "/", icon: "Home" },
  { label: "About", href: "/about", icon: "User" },
  { label: "Projects", href: "/projects", icon: "FolderGit2" },
  { label: "Labs", href: "/labs", icon: "FlaskConical" },
  { label: "Journal", href: "/journal", icon: "NotebookPen" },
  { label: "Certifications", href: "/certifications", icon: "BadgeCheck" },
  { label: "Resume", href: "/resume", icon: "FileText" },
  { label: "Contact", href: "/contact", icon: "Mail" },
] as const;
