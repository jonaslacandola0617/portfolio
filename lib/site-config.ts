/**
 * SITE CONFIG
 * ───────────
 * Seed/runtime fallback for identity, links, and the "currently learning" widget.
 */

export const siteConfig = {
  name: "Jonas Lacandola",
  initials: "JL",
  role: "Aspiring Cybersecurity Analyst",
  tagline:
    "Focused on networking, security operations, and continuous, documented learning.",
  location:
    "Based in the Philippines \u00b7 open to remote & on-site SOC/NetAdmin roles",
  email: "jonas.lacandola.sec@protonmail.com",
  social: {
    github: "https://github.com/jonaslacandola-sec",
    linkedin: "https://linkedin.com/in/jonaslacandola-sec",
    twitter: "https://x.com/jonaslacandola-sec",
  },
  resumeUrl: "/resume.pdf",
  siteUrl: "https://www.jonasl.online",
  description:
    "Cybersecurity & networking portfolio — labs, projects, and a running learning journal covering CCNA, Google Cybersecurity, Linux, and packet analysis.",

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
  { label: "Resume", href: "/resume", icon: "FileText" },
  { label: "Contact", href: "/contact", icon: "Mail" },
] as const;
