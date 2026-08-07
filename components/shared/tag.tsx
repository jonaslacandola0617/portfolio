import Link from "next/link";
import { cn, slugify } from "@/lib/utils";
export function Tag({ children, className, count }: { children: string; className?: string; count?: number }) {
  return <Link href={`/tags/${slugify(children)}`} className={cn("label border border-border px-1.5 py-0.5 text-muted transition-colors hover:border-border-strong hover:text-text", className)}>{children}{typeof count==="number"&&<span className="ml-1 text-muted">{count}</span>}</Link>;
}
