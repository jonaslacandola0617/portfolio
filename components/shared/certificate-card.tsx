import { ExternalLink, GraduationCap, Network, Terminal, FileCode2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badges";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import type { Certification } from "@/types";
import { ContentRenderer } from "@/components/shared/content-renderer";

const logoMap: Record<string, { icon: typeof GraduationCap; color: string }> = {
  google: { icon: GraduationCap, color: "text-primary" },
  cisco: { icon: Network, color: "text-success" },
  linux: { icon: Terminal, color: "text-warning" },
  python: { icon: FileCode2, color: "text-primary" },
};

export function CertificateCard({ cert }: { cert: Certification }) {
  const logo = logoMap[cert.logo] ?? logoMap.google;
  const LogoIcon = logo.icon;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
          <LogoIcon className={`h-5 w-5 ${logo.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display font-semibold text-foreground">{cert.name}</h3>
            <StatusBadge status={cert.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{cert.issuer}</p>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between font-mono text-[0.7rem] text-muted-foreground">
              <span>{cert.progressLabel}</span>
              <span>{cert.progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${cert.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {cert.skills.map((skill) => (
              <Badge key={skill} variant="default">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[0.68rem] text-muted-foreground">
            <span>Started {formatDateShort(cert.dateStarted)}</span>
            {cert.dateCompleted && <span>Completed {formatDateShort(cert.dateCompleted)}</span>}
            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                Credential <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
      {cert.content != null && (
        <div className="mt-5 border-t border-border pt-5">
          <ContentRenderer
            content={cert.content}
            context={{ model: "Certificate", slug: cert.id, title: cert.name }}
          />
        </div>
      )}
    </Card>
  );
}
