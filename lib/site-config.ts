/**
 * SITE CONFIG
 * ───────────
 * This is the one file to edit to make this portfolio yours.
 * Name, bio, links, and the "currently learning" widget all live here.
 */

export const siteConfig = {
  name: "Alex Rivera",
  initials: "AR",
  role: "Aspiring Cybersecurity Analyst",
  tagline:
    "Focused on networking, security operations, and continuous, documented learning.",
  location: "Based in the United States \u00b7 open to remote & on-site SOC/NetAdmin roles",
  email: "alex.rivera.sec@protonmail.com",
  social: {
    github: "https://github.com/alexrivera-sec",
    linkedin: "https://linkedin.com/in/alexrivera-sec",
    twitter: "https://x.com/alexriverasec",
  },
  resumeUrl: "/resume.pdf",
  siteUrl: "https://alexrivera.dev",
  description:
    "Cybersecurity & networking portfolio — labs, projects, and a running learning journal covering CCNA, Google Cybersecurity, Linux, and packet analysis.",

  currentlyLearning: [
    { label: "CCNA — Module 8: Subnetting", href: "/certifications" },
    { label: "Google Cybersecurity — Course 2", href: "/certifications" },
    { label: "Static & Default Routing", href: "/timeline" },
    { label: "VLANs & Trunking", href: "/timeline" },
    { label: "Linux command line fundamentals", href: "/timeline" },
  ],

  currentFocusStack: [
    "Google Cybersecurity",
    "Cisco CCNA",
    "Linux",
    "Networking",
    "Python",
    "Packet Tracer",
    "Wireshark",
  ],

} as const;

export const navItems = [
  { label: "Home", href: "/", icon: "Home" },
  { label: "About", href: "/about", icon: "User" },
  { label: "Projects", href: "/projects", icon: "FolderGit2" },
  { label: "Labs", href: "/labs", icon: "FlaskConical" },
  { label: "Journal", href: "/journal", icon: "NotebookPen" },
  { label: "Certifications", href: "/certifications", icon: "BadgeCheck" },
  { label: "Timeline", href: "/timeline", icon: "GitCommitHorizontal" },
  { label: "Skills", href: "/skills", icon: "Layers" },
  { label: "Resume", href: "/resume", icon: "FileText" },
  { label: "Contact", href: "/contact", icon: "Mail" },
] as const;
