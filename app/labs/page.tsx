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
        index="03"
        eyebrow="Lab Notebook"
        title="Labs"
        description="A chronological log of hands-on labs — purpose, commands, what went wrong, and what fixed it. Logged close to when the work happened, mistakes included."
      />
      <PageShell>
        {labs.length ? (
          <div className="space-y-5">
            {labs.map((lab, index) => (
              <LabCard key={lab.frontmatter.slug} lab={lab.frontmatter} index={index + 1} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-dim">No published labs yet.</p>
        )}
      </PageShell>
    </div>
  );
}
