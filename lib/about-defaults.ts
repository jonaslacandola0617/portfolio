import type { AboutPageValues } from "@/lib/validations/about";

/**
 * Exact content shipped with the Bauhaus prototype. This is also the safe
 * runtime fallback when the About JSON has not been saved yet.
 */
export const defaultAboutPage: AboutPageValues = {
  quote:
    "I got into this field by taking things apart — first literally, then packet by packet.",
  background:
    "I'm building toward a career in cybersecurity and network administration, coming at it from the hands-on side first: Packet Tracer topologies, Wireshark captures, and small scripts that automate the boring parts of watching a system. Everything on this site is real work I've done, documented the way I'd want a future teammate to find it.",
  currentFocus:
    "Right now that means working through the CCNA curriculum and the Google Cybersecurity Professional Certificate in parallel — networking fundamentals on one track, security operations on the other — because most real incidents sit at the intersection of both.",
  focusTags: [
    "Google Cybersecurity",
    "Cisco CCNA",
    "Linux",
    "Networking",
    "Python",
    "Packet Tracer",
    "Wireshark",
  ],
  learningPhilosophy:
    "I don't consider something learned until I've done it hands-on and written it down. That's the whole premise of this site: every lab has commands and verification steps, every project has objectives and outcomes, and every journal entry is dated the day the idea actually clicked.",
  whatsNext:
    "Finishing the CCNA and Google Cybersecurity tracks, then applying that foundation toward entry-level SOC or network administration roles — ideally somewhere I can keep learning in public the way I have here.",
};
