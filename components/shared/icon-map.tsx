import {
  Home,
  User,
  FolderGit2,
  FlaskConical,
  NotebookPen,
  BadgeCheck,
  GitCommitHorizontal,
  Layers,
  FileText,
  Mail,
  Network,
  ShieldCheck,
  Code2,
  type LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Home,
  User,
  FolderGit2,
  FlaskConical,
  NotebookPen,
  BadgeCheck,
  GitCommitHorizontal,
  Layers,
  FileText,
  Mail,
  Network,
  ShieldCheck,
  Code2,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = iconMap[name] ?? Home;
  return <Comp className={className} />;
}
