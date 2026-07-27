"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Added during the pre-Phase-6 stabilization pass (Workstream B1) — the
 * six admin forms' Create/Save buttons previously had no pending state
 * at all, so a slow request (or a double-click) looked identical to a
 * frozen page and could submit twice. `useFormStatus()` only works
 * inside a `<form>` that this component is a descendant of (it reads
 * the nearest parent form's pending state via context), which is why
 * this has to be its own client component rather than a prop threaded
 * down from the form's parent.
 */
interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  pendingLabel?: string;
  children: React.ReactNode;
}

export function SubmitButton({ pendingLabel, children, className, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className={cn(className)}
      {...props}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? pendingLabel ?? "Saving..." : children}
    </Button>
  );
}
