/**
 * As of Phase 3, this file is seed data, not runtime data — the public
 * /certifications page reads from Postgres via
 * lib/db/queries/certificates.ts. This array is what
 * prisma/seed/index.ts's seedCertificates() migrated into the database;
 * it stays here as that migration's source of truth / re-run reference,
 * the same role content/*.mdx now plays for Projects/Labs/Articles.
 */
import type { Certification } from "@/types";

export const certifications: Certification[] = [
  {
    id: "google-cybersecurity",
    name: "Google Cybersecurity Professional Certificate",
    issuer: "Google / Coursera",
    dateStarted: "2026-02-01",
    skills: [
      "Security frameworks & controls",
      "CIA triad",
      "Risk management",
      "SIEM fundamentals",
      "Incident response basics",
    ],
    logo: "google",
  },
  {
    id: "ccna",
    name: "Cisco Certified Network Associate (CCNA)",
    issuer: "Cisco / Jeremy's IT Lab",
    dateStarted: "2026-01-10",
    skills: [
      "IPv4 & IPv6 addressing",
      "VLANs & trunking",
      "Static & dynamic routing",
      "Switching fundamentals",
      "Network troubleshooting",
    ],
    logo: "cisco",
  },
  {
    id: "linux-essentials",
    name: "Linux Essentials (self-paced)",
    issuer: "Independent study",
    dateStarted: "2026-03-01",
    skills: ["Filesystem navigation", "Permissions & ownership", "Bash basics", "systemd services"],
    logo: "linux",
  },
  {
    id: "python-networking",
    name: "Python for Network Automation",
    issuer: "Independent study",
    dateStarted: "2026-09-01",
    skills: ["Scripting fundamentals", "Netmiko basics", "Parsing logs"],
    logo: "python",
  },
];
