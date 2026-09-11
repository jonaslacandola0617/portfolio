import { BadgeCheck, ChevronDown, ExternalLink } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import type { Certification } from "@/types";
import { ContentRenderer } from "@/components/shared/content-renderer";

export function CertificateCard({ cert, index = 1 }: { cert: Certification; index?: number }) {
  const dateLabel = cert.dateCompleted
    ? `Completed ${formatDateShort(cert.dateCompleted)}`
    : cert.dateStarted
      ? `Started ${formatDateShort(cert.dateStarted)}`
      : "In progress";

  return (
    <article className="credential-row">
      <span className="credential-number">{String(index).padStart(2, "0")}</span>
      <div className="credential-mark" aria-hidden="true">
        {cert.logoUrl ? <img src={cert.logoUrl} alt="" /> : <BadgeCheck size={21} />}
      </div>
      <div className="credential-copy">
        <span className="credential-issuer">{cert.issuer}</span>
        <h2>{cert.name}</h2>
        <div className="credential-skills">{cert.skills.slice(0, 6).map((skill) => <span key={skill}>{skill}</span>)}</div>
        {cert.content != null ? (
          <details className="credential-details">
            <summary><span>About this credential</span><ChevronDown size={13} /></summary>
            <div className="credential-description">
              <ContentRenderer content={cert.content} context={{ model: "Certificate", slug: cert.id, title: cert.name }} />
            </div>
          </details>
        ) : null}
      </div>
      <div className="credential-meta">
        <span>{dateLabel}</span>
        {cert.credentialUrl ? (
          <a href={cert.credentialUrl} target="_blank" rel="noreferrer">Credential <ExternalLink size={11} /></a>
        ) : <span className="credential-progress">In progress</span>}
      </div>
    </article>
  );
}
