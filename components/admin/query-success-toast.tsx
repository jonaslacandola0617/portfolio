"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function QuerySuccessToast({
  messages,
}: {
  messages: Record<string, string>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success } = useToast();

  useEffect(() => {
    const matched = Object.entries(messages).find(
      ([key]) => searchParams.get(key) === "1",
    );
    if (!matched) return;

    const [key, message] = matched;
    success(message, { id: `${pathname}:${key}` });

    const next = new URLSearchParams(searchParams.toString());
    next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [messages, pathname, router, searchParams, success]);

  return null;
}
