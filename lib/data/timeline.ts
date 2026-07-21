/**
 * As of Phase 3, this file is seed data, not runtime data — the public
 * /timeline page reads from Postgres via lib/db/queries/timeline.ts.
 */
import type { TimelineEntry } from "@/types";

export const timelineEntries: TimelineEntry[] = [
  {
    id: "t-01",
    date: "2026-01-10",
    title: "Started the CCNA curriculum",
    description:
      "Began working through Jeremy's IT Lab CCNA series alongside the official Cisco curriculum, starting with networking fundamentals and the OSI model.",
    category: "networking",
    tags: ["CCNA", "OSI Model"],
  },
  {
    id: "t-02",
    date: "2026-01-28",
    title: "Built first network in Packet Tracer",
    description:
      "Wired up a two-router, two-switch topology with static IP addressing and verified end-to-end connectivity with ping and traceroute.",
    category: "networking",
    tags: ["Packet Tracer", "Topology"],
  },
  {
    id: "t-03",
    date: "2026-02-01",
    title: "Enrolled in Google Cybersecurity Professional Certificate",
    description:
      "Started Course 1 — Foundations of Cybersecurity — covering the CIA triad, security frameworks, and the day-to-day of SOC work.",
    category: "security",
    tags: ["Google Cybersecurity"],
  },
  {
    id: "t-04",
    date: "2026-02-14",
    title: "Configured VLANs and inter-VLAN routing",
    description:
      "Segmented a switched network into three VLANs and configured router-on-a-stick for inter-VLAN routing, then documented the lab end to end.",
    category: "networking",
    tags: ["VLANs", "Switching"],
  },
  {
    id: "t-05",
    date: "2026-03-01",
    title: "Started Linux fundamentals",
    description:
      "Began daily practice in the Linux command line — filesystem navigation, permissions, package management, and basic shell scripting.",
    category: "linux",
    tags: ["Linux", "Bash"],
  },
  {
    id: "t-06",
    date: "2026-03-20",
    title: "Completed Google Cybersecurity Course 1",
    description:
      "Finished 'Foundations of Cybersecurity' with a final grade of 98% and started Course 2 on managing security risks.",
    category: "security",
    tags: ["Google Cybersecurity", "Milestone"],
  },
  {
    id: "t-07",
    date: "2026-04-15",
    title: "Learned static and default routing",
    description:
      "Configured static, default, and floating static routes across a multi-router topology, then broke and fixed routing on purpose to practice troubleshooting.",
    category: "networking",
    tags: ["Routing", "Troubleshooting"],
  },
  {
    id: "t-08",
    date: "2026-05-10",
    title: "First Wireshark packet capture analysis",
    description:
      "Captured and analyzed a TCP three-way handshake and a DNS query/response pair, mapping each frame back to the OSI and TCP/IP models.",
    category: "security",
    tags: ["Wireshark", "TCP/IP"],
  },
  {
    id: "t-09",
    date: "2026-06-05",
    title: "Built this portfolio",
    description:
      "Designed and built a documentation-style portfolio site to track labs, projects, and journal entries in public going forward.",
    category: "milestone",
    tags: ["Portfolio", "Next.js"],
  },
  {
    id: "t-10",
    date: "2026-07-01",
    title: "Started ACLs and NAT",
    description:
      "Currently working through standard and extended ACLs, plus static and dynamic NAT/PAT configuration, ahead of the CCNA security-services module.",
    category: "networking",
    tags: ["ACL", "NAT"],
  },
];
