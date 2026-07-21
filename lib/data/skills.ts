/**
 * As of Phase 3, this file is seed data, not runtime data — the public
 * /skills page reads from Postgres via lib/db/queries/skills.ts.
 */
import type { SkillCategory } from "@/types";

export const skillCategories: SkillCategory[] = [
  {
    category: "Networking",
    icon: "Network",
    skills: [
      { name: "IPv4 Addressing & Subnetting", level: "comfortable", relatedProjectSlugs: ["home-lab-network-segmentation"] },
      { name: "IPv6 Fundamentals", level: "practiced", relatedProjectSlugs: [] },
      { name: "VLANs & Trunking", level: "comfortable", relatedProjectSlugs: ["home-lab-network-segmentation"] },
      { name: "Static & Dynamic Routing", level: "practiced", relatedProjectSlugs: ["home-lab-network-segmentation"] },
      { name: "Switching Fundamentals", level: "comfortable", relatedProjectSlugs: ["home-lab-network-segmentation"] },
      { name: "NAT / PAT", level: "learning", relatedProjectSlugs: [] },
      { name: "Access Control Lists (ACL)", level: "learning", relatedProjectSlugs: [] },
    ],
  },
  {
    category: "Cybersecurity",
    icon: "ShieldCheck",
    skills: [
      { name: "CIA Triad & Security Frameworks", level: "practiced", relatedProjectSlugs: [] },
      { name: "Risk Management", level: "learning", relatedProjectSlugs: [] },
      { name: "Linux Command Line", level: "practiced", relatedProjectSlugs: ["linux-log-monitoring-script"] },
      { name: "SIEM Fundamentals", level: "learning", relatedProjectSlugs: [] },
      { name: "Packet & Traffic Analysis (Wireshark)", level: "practiced", relatedProjectSlugs: ["wireshark-tcp-handshake-analysis"] },
      { name: "Authentication & Access Control", level: "learning", relatedProjectSlugs: [] },
    ],
  },
  {
    category: "Programming",
    icon: "Code2",
    skills: [
      { name: "Python", level: "learning", relatedProjectSlugs: ["linux-log-monitoring-script"] },
      { name: "JavaScript", level: "practiced", relatedProjectSlugs: ["portfolio-website-nextjs"] },
      { name: "TypeScript", level: "practiced", relatedProjectSlugs: ["portfolio-website-nextjs"] },
      { name: "React", level: "practiced", relatedProjectSlugs: ["portfolio-website-nextjs"] },
      { name: "Next.js", level: "practiced", relatedProjectSlugs: ["portfolio-website-nextjs"] },
    ],
  },
];
