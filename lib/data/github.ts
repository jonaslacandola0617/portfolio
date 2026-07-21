import type { GitHubActivity } from "@/types";

/**
 * Static fallback for the GitHub activity widget.
 * Swap this for a live fetch against api.github.com/users/<you>/repos
 * once you're ready — see README.md for the snippet.
 */
export const githubActivity: GitHubActivity[] = [
  {
    repo: "home-lab-network-segmentation",
    description: "Packet Tracer topology + configs for a 3-VLAN segmented home lab.",
    language: "Packet Tracer",
    updatedAt: "2026-06-28",
    url: "https://github.com/alexrivera-sec/home-lab-network-segmentation",
  },
  {
    repo: "linux-log-monitor",
    description: "Small Python + bash utility that tails auth.log and flags failed SSH attempts.",
    language: "Python",
    updatedAt: "2026-06-20",
    url: "https://github.com/alexrivera-sec/linux-log-monitor",
  },
  {
    repo: "cyber-portfolio",
    description: "This site — Next.js, TypeScript, Tailwind, MDX-driven labs and journal.",
    language: "TypeScript",
    updatedAt: "2026-06-05",
    url: "https://github.com/alexrivera-sec/cyber-portfolio",
  },
];
