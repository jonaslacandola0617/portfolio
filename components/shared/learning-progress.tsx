import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LearningItem {
  label: string;
  href: string;
}

export function LearningProgress({ items }: { items: readonly LearningItem[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-mono uppercase tracking-wide text-muted-foreground">
          Currently Learning
        </CardTitle>
        <span className="flex h-2 w-2 rounded-full bg-success animate-pulse-dot" />
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-2.5 text-sm text-foreground/90 transition-colors hover:text-primary"
          >
            <CheckSquare className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{item.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
