import type { AboutPageValues } from "@/lib/validations/about";

export const defaultAboutPage: AboutPageValues = {
  eyebrow: "About",
  title: "Networking and security, learned in public",
  description: "A short version of how I got here, and how I like to work.",
  paragraphs: [
    "I got into networking the practical way: something at home wasn't working, I fixed it, and I wanted to understand why the fix worked instead of just being glad it did. That question — why does this work — is still the thing that pulls me from one topic to the next, whether it's subnetting, VLANs, or reading a packet capture line by line.",
    "Right now that means working through the Cisco CCNA curriculum alongside Jeremy's IT Lab and the official Cisco material, and the Google Cybersecurity Professional Certificate for the security-operations side. Linux and Python are running in parallel — Linux because so much of the tooling assumes comfort with the command line, and Python because automation is where a lot of this work is heading.",
    "I care more about being consistent than being impressive. A lab that took three attempts and includes the two wrong ones is more useful — to me and to anyone reading it — than a polished writeup that skips straight to the working configuration.",
  ],
  pillars: [
    { icon: "compass", title: "Curiosity first", body: "I follow the 'why does this work' question further than most tutorials want you to — packet captures, config diffs, and syslogs are how I actually learn a concept, not just read about it." },
    { icon: "wrench", title: "Build it broken, then fix it", body: "Almost everything in the Labs section includes a mistake I made on purpose or by accident, because the fix is usually the part worth remembering." },
    { icon: "refresh", title: "Document as you go", body: "Every lab and project here was written up within a day or two of finishing it — close enough to the work that the details are still accurate, not reconstructed from memory later." },
  ],
  focusLabel: "Currently focused on",
  currentFocus: ["Google Cybersecurity", "Cisco CCNA", "Linux", "Networking", "Python", "Packet Tracer", "Wireshark"],
};
