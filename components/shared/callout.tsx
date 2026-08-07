import {
  Info,
  TriangleAlert,
  CircleCheck,
  OctagonX,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutType = "info" | "warning" | "success" | "danger" | "tip";

const config: Record<
  CalloutType,
  { icon: typeof Info; rail: string; iconClass: string; label: string }
> = {
  info: { icon: Info, rail: "bg-cobalt", iconClass: "text-cobalt", label: "Info" },
  tip: { icon: Lightbulb, rail: "bg-cobalt", iconClass: "text-cobalt", label: "Tip" },
  warning: { icon: TriangleAlert, rail: "bg-signal", iconClass: "text-signal", label: "Warning" },
  success: { icon: CircleCheck, rail: "bg-teal", iconClass: "text-teal", label: "Success" },
  danger: { icon: OctagonX, rail: "bg-vermilion", iconClass: "text-vermilion", label: "Danger" },
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, rail, iconClass, label } = config[type];

  return (
    <aside className="relative my-5 border border-border bg-surface-2">
      <span className={cn("absolute bottom-0 left-0 top-0 w-[3px]", rail)} />
      <div className="flex items-center gap-2 border-b border-border py-2.5 pl-4 pr-3">
        <Icon className={cn("h-4 w-4 shrink-0", iconClass)} />
        <span className={cn("font-mono text-[10px] uppercase tracking-[0.14em]", iconClass)}>
          {label}
        </span>
        {title && (
          <span className="ml-1 font-display text-sm font-semibold text-text">
            {title}
          </span>
        )}
      </div>
      <div className="px-4 py-3 text-sm leading-6 text-text [&>p]:my-0 [&>p+p]:mt-3">
        {children}
      </div>
    </aside>
  );
}
