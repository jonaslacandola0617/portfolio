/**
 * PROFILE
 * ───────
 * Hand-maintained résumé facts used on the public site. These are not stored
 * in the CMS yet, so update this file when the résumé changes.
 */

export const availability = {
  roles: "IT help desk & technical support roles",
  where: "Remote or on-site in Clark / Pampanga",
  shifts: "Night shift OK",
};

export const headlineStats = [
  { value: "7 mo", label: "Client support experience" },
  { value: "40/day", label: "Cases handled at peak" },
  { value: "~98%", label: "Average accuracy" },
];

export type ExperienceEntry = {
  title: string;
  org: string;
  place?: string;
  period: string;
  summary: string;
  points: string[];
  /** Skills this experience demonstrates; also feeds the skills explorer. */
  skills: string[];
};

export const experience: ExperienceEntry[] = [
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
    period: "Ongoing",
    summary: "Most of my hands-on IT started at home, fixing whatever was broken.",
    points: [
      "Built my own PC, and built another one from salvaged parts: spare RAM sticks from around the house and an old laptop panel used as a monitor.",
      "Fix printers: connection problems, drivers, jams and queues that won't clear.",
      "Troubleshoot PCs that won't boot, run slowly or act up, and fix the minor problems before they become big ones.",
    ],
    skills: ["Hardware", "PC building", "Troubleshooting", "Printers", "Windows"],
  },
];

/** How the web projects were built, stated plainly. */
export const aiAssistedNote = {
  short: "AI-assisted build",
  long:
    "I wrote part of the code myself and used AI coding agents for the hardest parts. The setup and running of it is all mine: domains and DNS, deployment, connecting the database, environment configuration, testing, and fixing things when they broke.",
};

export const outsideIT = {
  title: "Outside IT, I design and edit.",
  intro:
    "Before and alongside IT, I've done creative work. It taught me patience with details and how to finish things for real people with real deadlines.",
  areas: [
    {
      name: "Graphic design",
      body: "Print materials, Facebook posts, logos and posters.",
      tools: ["Illustrator", "Photoshop"],
    },
    {
      name: "Video editing & cinematography",
      body: "Mostly short films, plus some same-day edits (SDEs) for events.",
      tools: ["Premiere Pro", "DaVinci Resolve"],
    },
    {
      name: "Experimenting",
      body: "Right now I'm making videos in Blender with Claude Code doing part of the work.",
      tools: ["Blender", "Claude Code"],
    },
  ],
};

/** Projects whose category matches this are labelled as AI-assisted builds. */
export const AI_ASSISTED_CATEGORY = /web|software|app/i;
