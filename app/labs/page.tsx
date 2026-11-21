import { PageHeader, PageShell } from "@/components/shared/page-header";
import { LabCard } from "@/components/shared/lab-card";
import { getAllLabs } from "@/lib/content";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "Technical Labs | Networking, Cybersecurity & IT",
  description:
    "Hands-on networking, CCNA, Packet Tracer, Linux, cybersecurity, and systems troubleshooting labs by Jonas Lacandola, including configurations, mistakes, fixes, and lessons learned.",
  path: "/labs",
  keywords: [
    "technical labs",
    "CCNA labs",
    "Packet Tracer labs",
    "networking labs",
    "cybersecurity labs",
    "Linux labs",
    "IT troubleshooting labs",
    "VLAN lab",
    "routing lab",
  ],
});

export default async function LabsPage() {
  const labs = await getAllLabs();
  return (
    <div>
      <PageHeader
        index="Labs"
        eyebrow={`${labs.length} ${labs.length === 1 ? "lab" : "labs"}`}
        title="Hands-on lab notebook."
        description="Networking and security labs, written up as I did them: the goal, the topology, the commands, what went wrong, and how I checked the fix."
      />
      <PageShell>
        {labs.length ? (
          <div className="lab-grid">
            {labs.map((lab, index) => <LabCard key={lab.frontmatter.slug} lab={lab.frontmatter} index={index} headingLevel="h2" />)}
          </div>
        ) : (
          <p className="muted">No published labs yet.</p>
        )}
      </PageShell>
    </div>
  );
}
