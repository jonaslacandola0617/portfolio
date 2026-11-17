/**
 * SITE CONFIG
 * ───────────
 * Seed/runtime fallback for identity, links, and the "currently learning" widget.
 */

export const siteConfig = {
  name: "Jonas Lacandola",
  initials: "JL",
  role: "IT Support · Networking · Cybersecurity",
  tagline:
    "I troubleshoot systems, configure and secure networks, and document every fix — with enough development experience to build the tools a team is missing.",
  location:
    "Based in the Philippines · open to remote & on-site IT support, network administration, and cybersecurity roles",
  email: "jonas.lacandola.sec@protonmail.com",
  social: {
    github: "https://github.com/jonaslacandola-sec",
    linkedin: "https://linkedin.com/in/jonaslacandola-sec",
    twitter: "https://x.com/jonaslacandola-sec",
  },
  resumeUrl: "/resume.pdf",
  siteUrl: "https://www.jonasl.online",
  description:
    "IT support, networking, and cybersecurity portfolio by Jonas Lacandola — documented Cisco and Linux labs, certifications, troubleshooting notes, and technical projects.",

  currentlyLearning: [
    { label: "CCNA — Module 8: Subnetting", href: "/certifications" },
    { label: "Google Cybersecurity — Course 2", href: "/certifications" },
    { label: "Static & Default Routing", href: "/labs/static-routing-configuration" },
    { label: "VLANs & Trunking", href: "/labs/vlan-trunking-lab" },
    { label: "Linux command line fundamentals", href: "/labs/linux-file-permissions-practice" },
  ],

  currentFocusStack: ["Laravel", "PHP", "React", "Next.js", "TypeScript", "SQL", "Networking", "Cybersecurity"],
} as const;

export const navItems = [
  { label: "Home", href: "/", icon: "Home" },
  { label: "About", href: "/about", icon: "User" },
  { label: "Projects", href: "/projects", icon: "FolderGit2" },
  { label: "Labs", href: "/labs", icon: "FlaskConical" },
  { label: "Journal", href: "/journal", icon: "NotebookPen" },
  { label: "Video", href: "/video", icon: "Film" },
  { label: "Certifications", href: "/certifications", icon: "BadgeCheck" },
  { label: "Resume", href: "/resume", icon: "FileText" },
  { label: "Contact", href: "/contact", icon: "Mail" },
] as const;
