import type { Metadata } from "next";
import { Compass, RefreshCw, Wrench } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAboutPage } from "@/lib/db/queries/about";

export const metadata: Metadata = { title: "About" };

const icons = { compass: Compass, wrench: Wrench, refresh: RefreshCw };

export default async function AboutPage() {
  const about = await getAboutPage();
  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <PageHeader eyebrow={about.eyebrow} title={about.title} description={about.description} />

      <div className="space-y-5 text-[0.975rem] leading-7 text-foreground/90">
        {about.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {about.pillars.map((pillar) => {
          const Icon = icons[pillar.icon];
          return (
            <Card key={pillar.title}>
              <CardContent className="pt-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{pillar.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 border-t border-border pt-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">{about.focusLabel}</h2>
        <div className="flex flex-wrap gap-2">
          {about.currentFocus.map((item) => <Badge key={item} variant="primary">{item}</Badge>)}
        </div>
      </div>
    </div>
  );
}
