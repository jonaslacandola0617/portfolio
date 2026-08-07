import * as React from "react";
import { cva,type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants=cva("label inline-flex items-center gap-1 border px-1.5 py-0.5 transition-colors",{variants:{variant:{default:"border-border text-muted",primary:"border-cobalt/40 text-cobalt",success:"border-teal/40 text-teal",warning:"border-signal/40 text-signal",destructive:"border-vermilion/40 text-vermilion",outline:"border-border text-text-dim"}},defaultVariants:{variant:"default"}});
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>,VariantProps<typeof badgeVariants>{}
function Badge({className,variant,...props}:BadgeProps){return <span className={cn(badgeVariants({variant}),className)} {...props}/>}
export {Badge,badgeVariants};
