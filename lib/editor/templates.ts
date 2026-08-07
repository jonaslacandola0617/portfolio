import type { TipTapBlockNode, TipTapDoc } from "@/types/tiptap";

export type TemplateContentType = "project" | "article" | "lab";

export interface ContentTemplate {
  id: string;
  contentType: TemplateContentType;
  category: string;
  name: string;
  description: string;
  sections: string[];
  document: TipTapDoc;
}

function heading(text: string): TipTapBlockNode {
  return { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] };
}

function emptyParagraph(): TipTapBlockNode {
  return { type: "paragraph", content: [] };
}

function sectionedDoc(sections: string[]): TipTapDoc {
  return { type: "doc", content: sections.flatMap((title) => [heading(title), emptyParagraph()]) };
}

export const emptyTemplate: TipTapDoc = { type: "doc", content: [{ type: "paragraph" }] };

function template(
  contentType: TemplateContentType,
  id: string,
  category: string,
  name: string,
  description: string,
  sections: string[]
): ContentTemplate {
  return { id, contentType, category, name, description, sections, document: sectionedDoc(sections) };
}

export const projectTemplates: ContentTemplate[] = [
  { id: "project-blank", contentType: "project", category: "Blank", name: "Blank project", description: "Start with an empty document.", sections: [], document: emptyTemplate },
  template("project", "project-web", "Web Development", "Web Development", "Document a full-stack web product from user need through deployment.", ["Overview", "Problem or User Need", "Requirements", "Technology Stack", "Frontend Architecture", "Backend and Data", "Main Features", "Testing", "Deployment", "Challenges", "Lessons Learned"]),
  template("project", "project-software", "Application Development", "Software or Application Development", "Describe an application, its modules, data model, and implementation decisions.", ["Problem Statement", "Requirements", "System Architecture", "Core Modules", "Implementation", "Data Model", "Testing Strategy", "Challenges", "Results", "Future Improvements"]),
  template("project", "project-networking", "Networking", "Networking Project", "Capture topology, addressing, configuration, and verification evidence.", ["Objectives", "Requirements", "Network Topology", "Addressing Plan", "Devices and Technologies", "Configuration", "Verification", "Troubleshooting", "Results", "Lessons Learned"]),
  template("project", "project-cybersecurity", "Cybersecurity", "Cybersecurity Project", "Frame security work around scope, threat model, controls, findings, and recommendations.", ["Security Problem", "Scope", "Threat Model", "Environment", "Tools", "Security Controls", "Implementation", "Validation", "Findings", "Recommendations", "Lessons Learned"]),
  template("project", "project-migration", "Migration", "Migration or Refactoring", "Explain a system transition without losing compatibility and operational context.", ["Previous System", "Existing Problems", "Migration Goals", "Architecture Changes", "Migration Process", "Compatibility Considerations", "Testing", "Challenges", "Outcome", "Future Work"]),
];

export const articleTemplates: ContentTemplate[] = [
  { id: "article-blank", contentType: "article", category: "Blank", name: "Blank article", description: "Start with an empty journal document.", sections: [], document: emptyTemplate },
  template("article", "article-learning", "Journal", "Learning Journal", "Record what you learned, practiced, and plan to revisit.", ["Topic", "What I Learned", "Important Concepts", "Practical Activities", "Challenges", "Reflection", "Next Steps"]),
  template("article", "article-tutorial", "Tutorial", "Technical Tutorial", "Teach a repeatable technical workflow with verification and troubleshooting.", ["Goal", "Prerequisites", "Environment", "Step-by-Step Instructions", "Verification", "Troubleshooting", "Conclusion", "References"]),
  template("article", "article-concept", "Explanation", "Concept Explanation", "Explain a technical concept from fundamentals through real use cases.", ["Introduction", "Core Concepts", "How It Works", "Practical Example", "Common Misunderstandings", "Use Cases", "Summary"]),
  template("article", "article-retrospective", "Retrospective", "Project Retrospective", "Reflect on delivery choices, tradeoffs, outcomes, and improvements.", ["Project Context", "Original Goals", "What Was Built", "What Went Well", "Challenges", "Decisions and Tradeoffs", "Lessons Learned", "What I Would Improve"]),
  template("article", "article-course", "Reflection", "Course or Certification Reflection", "Connect course work and practical activities to career development.", ["Course Overview", "Topics Covered", "Skills Developed", "Practical Activities", "Most Valuable Lessons", "Challenges", "Application to Career Goals", "Next Steps"]),
];

export const labTemplates: ContentTemplate[] = [
  { id: "lab-blank", contentType: "lab", category: "Blank", name: "Blank Lab", description: "Start with an empty lab notebook.", sections: [], document: emptyTemplate },
  template("lab", "lab-networking", "Networking", "Networking Lab", "Document topology, configuration, validation, and lessons learned.", ["Purpose", "Topology", "Addressing Plan", "Devices", "Configuration", "Verification", "Troubleshooting", "Lessons Learned"]),
  template("lab", "lab-cybersecurity", "Cybersecurity", "Cybersecurity Lab", "Record scope, tools, controls, evidence, and findings.", ["Purpose", "Scope", "Environment", "Tools", "Procedure", "Evidence", "Findings", "Remediation", "Lessons Learned"]),
  template("lab", "lab-troubleshooting", "Troubleshooting", "Troubleshooting Lab", "Follow symptoms through hypotheses, tests, root cause, and fix.", ["Symptoms", "Environment", "Initial Hypotheses", "Diagnostic Steps", "Root Cause", "Resolution", "Verification", "Prevention"]),
  template("lab", "lab-packet-analysis", "Packet Analysis", "Packet Analysis Lab", "Analyze captures using filters, protocol fields, and evidence.", ["Objective", "Capture Environment", "Capture Method", "Display Filters", "Protocol Analysis", "Findings", "Validation", "Conclusion"]),
];

export const templateCatalog = [...projectTemplates, ...articleTemplates, ...labTemplates];

export function getTemplateDocument(id: string, contentType: TemplateContentType): TipTapDoc {
  const selected = templateCatalog.find((item) => item.id === id && item.contentType === contentType);
  return selected?.document ?? emptyTemplate;
}

// Compatibility exports for older imports. Creation now calls getTemplateDocument explicitly.
export const projectTemplate = emptyTemplate;
export const articleTemplate = emptyTemplate;
export const labTemplate = emptyTemplate;
