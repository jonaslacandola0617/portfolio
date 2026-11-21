import { BadgeCheck, ChevronDown, ExternalLink } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import type { Certification } from "@/types";
import { ContentRenderer } from "@/components/shared/content-renderer";

/** One certificate row: issuer, name, status, verify link, skills, and optional details. */
export function CertificateCard({ cert }: { cert: Certification; index?: number }) {
  const status = cert.dateCompleted
    ? `Completed ${formatDateShort(cert.dateCompleted)}`
    : cert.dateStarted
      ? `Started ${formatDateShort(cert.dateStarted)}`
      : "In progress";

  return (
    <li className="cert-item">
      <div className="cert-row">
        <span className="cert-mark" aria-hidden="true">
          {cert.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cert.logoUrl} alt="" />
          ) : <BadgeCheck size={20} />}
        </span>
        <span className="cert-copy">
          <small>{cert.issuer}</small>
          <strong>{cert.name}</strong>
        </span>
        <span className={cert.dateCompleted ? "cert-status is-done" : "cert-status"}>{status}</span>
        {cert.credentialUrl ? (
          <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Verify <ExternalLink size={13} /></a>
        ) : <span />}
      </div>
      {cert.skills.length || cert.content != null ? (
        <div className="cert-extra">
          {cert.skills.length ? <ul className="chip-list" aria-label="Skills covered">{cert.skills.slice(0, 10).map((skill) => <li key={skill}>{skill}</li>)}</ul> : null}
          {cert.content != null ? (
            <details className="cert-details">
              <summary>What it covered <ChevronDown size={15} aria-hidden="true" /></summary>
              <div className="cert-details-body">
                <ContentRenderer content={cert.content} context={{ model: "Certificate", slug: cert.id, title: cert.name }} />
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
