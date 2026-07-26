import type { Metadata } from "next";
import { Download, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/db/queries/settings";

export const metadata: Metadata = { title: "Resume" };

export default async function ResumePage() {
  const settings = await getSiteSettings();
  const resumeUrl = settings.resumeUrl;

  return (
    <div className="mx-auto max-w-4xl px-6 py-14 md:px-10">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Resume"
          title="Resume"
          description="A one-page summary of the technical skills, projects, and coursework covered elsewhere on this site."
        />
        <div className="mb-10 flex gap-2">
          <Button asChild variant="secondary">
            <a href={resumeUrl} target="_blank" rel="noreferrer">
              Open in new tab <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild>
            <a href={resumeUrl} download>
              Download PDF <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <object data={resumeUrl} type="application/pdf" width="100%" height="900" className="hidden sm:block">
          <p className="p-8 text-sm text-muted-foreground">
            Your browser doesn&rsquo;t support embedded PDFs.{" "}
            <a href={resumeUrl} className="text-primary hover:underline">
              Download the resume
            </a>{" "}
            instead.
          </p>
        </object>
        <div className="p-8 text-center text-sm text-muted-foreground sm:hidden">
          PDF preview isn&rsquo;t available on small screens.{" "}
          <a href={resumeUrl} className="text-primary hover:underline">
            Open the resume directly
          </a>
          .
        </div>
      </div>
    </div>
  );
}
