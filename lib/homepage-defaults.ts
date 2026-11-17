import type { HomepageContent } from "@/lib/validations/homepage";

/**
 * Built-in homepage content. Used until the Homepage editor saves a version,
 * and to fill any field a saved version is missing.
 */
export const defaultHomepage: HomepageContent = {
  hero: {
    availabilityRoles: "IT help desk & technical support roles",
    availabilityWhere: "Remote or on-site in Clark / Pampanga",
    availabilityShifts: "Night shift OK",
    highlight: "IT support",
    headline: "with a networking and security foundation.",
    intro:
      "I spent seven months handling up to 40 healthcare cases a day at about 98% accuracy, under hard deadlines and strict privacy rules. I build and fix PCs and printers, and I've trained in Cisco networking and Google cybersecurity. Now I want to do that work on an IT team.",
    primaryCtaLabel: "See my experience",
    primaryCtaHref: "#experience",
  },
  stats: [
    { value: "7 mo", label: "Client support experience" },
    { value: "40/day", label: "Cases handled at peak" },
    { value: "~98%", label: "Average accuracy" },
  ],
  showCertificateStat: true,
  experience: [
    {
      title: "Client Support Specialist (Arbitration Specialist)",
      org: "Global Strategic Business Process Solutions",
      place: "West Aeropark, Clark",
      period: "Aug 2025 – Mar 2026",
      summary:
        "Owned Federal IDR healthcare dispute cases from intake to close. It was a queue-based job with hard regulatory deadlines, which is very close to how a help desk runs.",
      points: [
        "Handled 25 cases a day at the start and 40 a day after two to three months, without missing regulatory deadlines.",
        "Kept about 98% average accuracy while auditing medical billing and payment records in Excel.",
        "Worked with confidential client and healthcare data under strict privacy and security rules.",
        "Was the point of contact for clients through the process, and sorted out documentation and eligibility problems.",
        "Worked daily in the company's internal case database, Outlook and Excel.",
      ],
      skills: ["Client support", "Case management", "Deadline tracking", "Documentation", "Data privacy", "Excel", "Outlook"],
    },
    {
      title: "Hardware & troubleshooting",
      org: "Personal and for family and friends",
      place: "",
      period: "Ongoing",
      summary: "Most of my hands-on IT started at home, fixing whatever was broken.",
      points: [
        "Built my own PC, and built another one from salvaged parts: spare RAM sticks from around the house and an old laptop panel used as a monitor.",
        "Fix printers: connection problems, drivers, jams and queues that won't clear.",
        "Troubleshoot PCs that won't boot, run slowly or act up, and fix the minor problems before they become big ones.",
      ],
      skills: ["Hardware", "PC building", "Troubleshooting", "Printers", "Windows"],
    },
  ],
  capabilities: [
    {
      icon: "support",
      title: "Support people",
      body: "I've worked a real queue: high volume, hard deadlines, confidential data, and people waiting on an answer. I stay calm and I write things down.",
      linkLabel: "Experience",
      href: "#experience",
    },
    {
      icon: "hardware",
      title: "Fix hardware",
      body: "PCs that won't boot, printers that won't print, builds from spare parts. I like finding the actual cause instead of guessing.",
      linkLabel: "Hands-on work",
      href: "#experience",
    },
    {
      icon: "network",
      title: "Understand networks",
      body: "Subnetting and VLSM, VLANs and trunking, inter-VLAN and static routing on Cisco IOS. I set it up, test it, and document it.",
      linkLabel: "Documented labs",
      href: "/labs",
    },
    {
      icon: "security",
      title: "Think about security",
      body: "Google's cybersecurity training: NIST CSF, security controls, logs and SIEM basics, incident response, Linux and SQL.",
      linkLabel: "Certificates",
      href: "/certifications",
    },
  ],
  outside: {
    linkLabel: "See video work",
    href: "/video",
    areas: [
      { name: "Graphic design", body: "Print materials, Facebook posts, logos and posters.", tools: ["Illustrator", "Photoshop"] },
      { name: "Video editing & cinematography", body: "Mostly short films, plus some same-day edits (SDEs) for events.", tools: ["Premiere Pro", "DaVinci Resolve"] },
      { name: "Experimenting", body: "Right now I'm making videos in Blender with Claude Code doing part of the work.", tools: ["Blender", "Claude Code"] },
    ],
  },
  aiNote: {
    short: "AI-assisted build",
    long:
      "I wrote part of the code myself and used AI coding agents for the hardest parts. The setup and running of it is all mine: domains and DNS, deployment, connecting the database, environment configuration, testing, and fixing things when they broke.",
  },
  sections: {
    experience: {
      visible: true,
      kicker: "Experience",
      title: "Seven months in a support queue, and a lot of fixing things at home.",
      intro: "My first job wasn't in IT, but the work was close to help desk: tickets, deadlines, accuracy, privacy, and people waiting on you.",
    },
    labs: {
      visible: true,
      kicker: "Networking labs",
      title: "Networks I've built, broken and fixed.",
      intro: "Each lab has the goal, the topology, the commands I used, what went wrong, and how I checked the fix.",
    },
    certificates: { visible: true, kicker: "Certificates", title: "Training I've completed.", intro: "" },
    skills: {
      visible: true,
      kicker: "Skills",
      title: "Pick a skill, see where I used it.",
      intro: "Every skill links to the job, lab, certificate or project where I actually used it.",
    },
    capabilities: { visible: true, kicker: "What I bring", title: "What I can do for an IT team.", intro: "" },
    projects: { visible: true, kicker: "Projects", title: "Things I've set up and shipped.", intro: "" },
    outside: {
      visible: true,
      kicker: "Outside IT",
      title: "Outside IT, I design and edit.",
      intro: "Before and alongside IT, I've done creative work. It taught me patience with details and how to finish things for real people with real deadlines.",
    },
    writing: { visible: true, kicker: "Writing", title: "Notes from what I'm learning.", intro: "" },
  },
};
