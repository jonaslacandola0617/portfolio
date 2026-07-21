import { Info, TriangleAlert, CircleCheck, OctagonX, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutType = "info" | "warning" | "success" | "danger" | "tip";

const config: Record<CalloutType, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "border-primary/30 bg-primary/5 text-primary" },
  tip: { icon: Lightbulb, className: "border-primary/30 bg-primary/5 text-primary" },
  warning: { icon: TriangleAlert, className: "border-warning/30 bg-warning/5 text-warning" },
  success: { icon: CircleCheck, className: "border-success/30 bg-success/5 text-success" },
  danger: { icon: OctagonX, className: "border-destructive/30 bg-destructive/5 text-destructive" },
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
  const { icon: Icon, className } = config[type];

  return (
    <div className={cn("my-5 flex gap-3 rounded-lg border px-4 py-3.5", className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="text-sm leading-6 text-foreground/90">
        {title && <p className="mb-1 font-display font-semibold text-foreground">{title}</p>}
        {children}
      </div>
    </div>
  );
}
