import type { Metadata } from "next";
import { Mail, Github, Linkedin, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/shared/contact-form";
import { getSiteSettings } from "@/lib/db/queries/settings";

export const metadata: Metadata = { title: "Contact" };

function handleFromUrl(url: string) {
  try {
    return new URL(url).pathname.replace(/^\//, "").replace(/\/$/, "") || url;
  } catch {
    return url;
  }
}

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const links = [
    { label: "Email", value: settings.email, href: `mailto:${settings.email}`, icon: Mail },
    { label: "GitHub", value: handleFromUrl(settings.githubUrl), href: settings.githubUrl, icon: Github },
    { label: "LinkedIn", value: handleFromUrl(settings.linkedinUrl), href: settings.linkedinUrl, icon: Linkedin },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description="Open to SOC Analyst, Network Administrator, IT Support, and Security Operations roles — reach out directly or use the form below."
      />

      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
            className="group"
          >
            <Card className="h-full p-4 transition-colors hover:border-primary/40">
              <div className="flex items-center justify-between">
                <link.icon className="h-4 w-4 text-primary" />
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover:text-primary" />
              </div>
              <div className="mt-3 text-sm font-medium text-foreground">{link.label}</div>
              <div className="truncate font-mono text-xs text-muted-foreground">{link.value}</div>
            </Card>
          </a>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <ContactForm email={settings.email} />
        </CardContent>
      </Card>
    </div>
  );
}
