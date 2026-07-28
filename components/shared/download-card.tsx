import { Download, Github, FileText, FileCode2, File, Network, Archive } from "lucide-react";
import type { DownloadLink } from "@/types";

const typeConfig: Record<DownloadLink["type"], { icon: typeof Download; label: string }> = {
  "packet-tracer": { icon: FileCode2, label: "Packet Tracer" },
  pcap: { icon: Network, label: "PCAP" },
  config: { icon: FileText, label: "Config" },
  github: { icon: Github, label: "Repository" },
  pdf: { icon: File, label: "PDF" },
  zip: { icon: Archive, label: "ZIP archive" },
  other: { icon: Download, label: "File" },
};

export function DownloadCard({ item }: { item: DownloadLink }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{item.label}</div>
        {item.description && <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</div>}
        <div className="font-mono text-[0.68rem] text-muted-foreground">{config.label}</div>
      </div>
      <Download className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
    </a>
  );
}
