import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site-config";
import { Compass, Wrench, RefreshCw } from "lucide-react";

export const metadata: Metadata = { title: "About" };

const pillars = [
  {
    icon: Compass,
    title: "Curiosity first",
    body: "I follow the 'why does this work' question further than most tutorials want you to — packet captures, config diffs, and syslogs are how I actually learn a concept, not just read about it.",
  },
  {
    icon: Wrench,
    title: "Build it broken, then fix it",
    body: "Almost everything in the Labs section includes a mistake I made on purpose or by accident, because the fix is usually the part worth remembering.",
  },
  {
    icon: RefreshCw,
    title: "Document as you go",
    body: "Every lab and project here was written up within a day or two of finishing it — close enough to the work that the details are still accurate, not reconstructed from memory later.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <PageHeader
        eyebrow="About"
        title="Networking and security, learned in public"
        description="A short version of how I got here, and how I like to work."
      />

      <div className="space-y-5 text-[0.975rem] leading-7 text-foreground/90">
        <p>
          I got into networking the practical way: something at home wasn&rsquo;t working, I fixed
          it, and I wanted to understand why the fix worked instead of just being glad it did.
          That question — <em>why does this work</em> — is still the thing that pulls me from one
          topic to the next, whether it&rsquo;s subnetting, VLANs, or reading a packet capture line
          by line.
        </p>
        <p>
          Right now that means working through the Cisco CCNA curriculum alongside Jeremy&rsquo;s
          IT Lab and the official Cisco material, and the Google Cybersecurity Professional
          Certificate for the security-operations side. Linux and Python are running in parallel —
          Linux because so much of the tooling assumes comfort with the command line, and Python
          because automation is where a lot of this work is heading.
        </p>
        <p>
          I care more about being consistent than being impressive. A lab that took three attempts
          and includes the two wrong ones is more useful — to me and to anyone reading it — than a
          polished writeup that skips straight to the working configuration.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title}>
            <CardContent className="pt-5">
              <pillar.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-display text-sm font-semibold text-foreground">{pillar.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{pillar.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 border-t border-border pt-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Currently focused on
        </h2>
        <div className="flex flex-wrap gap-2">
          {siteConfig.currentFocusStack.map((item) => (
            <Badge key={item} variant="primary">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
