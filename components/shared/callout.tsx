import { Info, TriangleAlert, CircleCheck, OctagonX, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutType = "info" | "warning" | "success" | "danger" | "tip";

const config: Record<CalloutType, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "border-cobalt/30 bg-cobalt-dim text-cobalt" },
  tip: { icon: Lightbulb, className: "border-cobalt/30 bg-cobalt-dim text-cobalt" },
  warning: { icon: TriangleAlert, className: "border-signal/30 bg-signal/5 text-signal" },
  success: { icon: CircleCheck, className: "border-teal/30 bg-teal/5 text-teal" },
  danger: { icon: OctagonX, className: "border-vermilion/30 bg-vermilion/5 text-vermilion" },
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
    <div className={cn("my-5 flex gap-3 border px-4 py-3.5", className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="text-sm leading-6 text-text/90">
        {title && <p className="mb-1 font-display font-semibold text-text">{title}</p>}
        {children}
      </div>
    </div>
  );
}
