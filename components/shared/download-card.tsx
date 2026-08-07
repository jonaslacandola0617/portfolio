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
      className="group flex items-center gap-3 border border-border bg-surface-2 p-4 transition-all hover:border-cobalt/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-surface-3 text-cobalt">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-text">{item.label}</div>
        {item.description && <div className="mt-0.5 line-clamp-2 text-xs text-text-dim">{item.description}</div>}
        <div className="font-mono text-[0.68rem] text-text-dim">{config.label}</div>
      </div>
      <Download className="h-4 w-4 shrink-0 text-text-dim/60 transition-colors group-hover:text-cobalt" />
    </a>
  );
}
