import type { AboutPageValues } from "@/lib/validations/about";

/**
 * Exact content shipped with the Bauhaus prototype. This is also the safe
 * runtime fallback when the About JSON has not been saved yet.
 */
export const defaultAboutPage: AboutPageValues = {
  profileImageUrl: null,
  quote:
    "I learn best by building things, breaking things, and figuring out why they work.",
  background:
    "I work across web development, IT support, networking, and cybersecurity. I enjoy building practical applications as much as understanding the systems underneath them. My work includes full-stack web applications, APIs, e-commerce projects, networking labs, and technical documentation — each one built around solving a real problem and learning by doing.",
  currentFocus:
    "I'm currently sharpening my PHP and Laravel skills while continuing to build with React, Next.js, TypeScript, and SQL. Alongside development, I'm strengthening my networking and cybersecurity foundation through Cisco labs, Linux, troubleshooting, and structured security training.",
  focusTags: [
    "Laravel",
    "PHP",
    "React",
    "Next.js",
    "TypeScript",
    "SQL",
    "Linux",
    "Networking",
    "Cybersecurity",
  ],
  learningPhilosophy:
    "I don't consider something learned just because I've read the documentation or completed a course. I want to build with it, troubleshoot it, understand what went wrong, and be able to explain it afterward. That's why this portfolio includes both finished work and the process behind what I've learned.",
  whatsNext:
    "I'm focused on shipping stronger web applications, refining the projects in this portfolio, and pursuing opportunities where I can contribute across web development, IT support, and technical problem solving while continuing to deepen my networking and cybersecurity skills.",
};
