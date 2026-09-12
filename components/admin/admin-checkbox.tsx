"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
}

export function AdminCheckbox({
  className,
  indeterminate = false,
  ...props
}: AdminCheckboxProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span className={cn("admin-checkbox", className)}>
      <input ref={inputRef} type="checkbox" {...props} />
      <span className="admin-checkbox-mark" aria-hidden="true">
        {indeterminate ? (
          <Minus className="admin-checkbox-icon" />
        ) : (
          <Check className="admin-checkbox-icon" />
        )}
      </span>
    </span>
  );
}
