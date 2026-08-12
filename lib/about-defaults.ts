import type { AboutPageValues } from "@/lib/validations/about";

/**
 * Exact content shipped with the Bauhaus prototype. This is also the safe
 * runtime fallback when the About JSON has not been saved yet.
 */
export const defaultAboutPage: AboutPageValues = {
  profileImageUrl: null,
  quote:
    "I'm Jonas Lacandola, a web developer and technical problem solver who builds practical applications, troubleshoots systems, and continues to deepen my skills in networking and cybersecurity.",
  background:
    "My work spans software development and IT. I've built full-stack web applications, APIs, e-commerce projects, and technical tools, while also gaining professional experience in client support, data management, documentation, and handling sensitive information. That combination has shaped how I approach technology: understand the problem, build or troubleshoot the right solution, and communicate it clearly.",
  currentFocus:
    "My current focus is web development, particularly PHP and Laravel alongside React, Next.js, TypeScript, and SQL. In parallel, I continue building my networking and security foundation through Cisco labs, Linux, troubleshooting, and cybersecurity training.",
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
    "I learn fastest by building. When I pick up a technology, I want to use it in a real project, run into the problems that come with it, troubleshoot them, and understand the decisions behind the solution. This portfolio documents both what I've built and what I learned while building it.",
  whatsNext:
    "I'm looking for opportunities where I can contribute in web development, IT support, or broader technical roles while continuing to build stronger applications and deepen my networking and cybersecurity skills.",
};
