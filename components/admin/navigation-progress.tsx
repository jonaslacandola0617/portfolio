"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    setActive(false);
  }, [pathname]);

  return (
    <div
      onClickCapture={(event) => {
        const target = event.target as HTMLElement;
        const link = target.closest("a");
        if (!link || event.defaultPrevented || link.target === "_blank" || link.origin !== window.location.origin) return;
        if (link.pathname !== window.location.pathname || link.search !== window.location.search) setActive(true);
      }}
    >
      <div
        role="progressbar"
        aria-label="Loading admin page"
        aria-hidden={!active}
        className={`pointer-events-none fixed left-0 top-0 z-[70] h-0.5 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.65)] transition-all duration-300 lg:left-[272px] ${
          active ? "w-[70%] opacity-100 lg:w-[55%]" : "w-0 opacity-0"
        }`}
      />
      {children}
    </div>
  );
}
