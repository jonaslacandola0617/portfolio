"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType, type CSSProperties } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fades content in once it scrolls into view. Content is visible without JS. */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // already on screen: never hide it
    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", className)}
      data-reveal={state}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Copies the email address and confirms it inline — no mail client required. */
export function CopyEmail({ email, className, label }: { email: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className={cn("copy-email", className)}
      data-copied={copied}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
        } catch {
          window.location.href = `mailto:${email}`;
        }
      }}
    >
      <span className="copy-email-text">{label ?? email}</span>
      <span className="copy-email-icon" aria-hidden="true">{copied ? <Check size={15} /> : <Copy size={15} />}</span>
      <span className="sr-only" aria-live="polite">{copied ? "Email address copied" : ""}</span>
    </button>
  );
}

/** Live clock in the Philippines so remote teams know when to expect a reply. */
export function LocalTime({ timeZone = "Asia/Manila", city = "Manila" }: { timeZone?: string; city?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const time = now
    ? now.toLocaleTimeString("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false })
    : "--:--";
  const hour = now ? Number(now.toLocaleString("en-US", { timeZone, hour: "numeric", hour12: false })) : 12;
  const awake = hour >= 8 && hour < 23;

  return (
    <span className="local-time" suppressHydrationWarning>
      <span className={cn("local-time-dot", awake && "is-awake")} aria-hidden="true" />
      {city} <b suppressHydrationWarning>{time}</b> <span className="local-time-zone">GMT+8</span>
    </span>
  );
}

/** Media frame that tilts toward the pointer and carries a soft spotlight. */
export function TiltFrame({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn("tilt-frame", className)}
      onPointerMove={(event) => {
        const element = ref.current;
        if (!element || event.pointerType === "touch") return;
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        element.style.setProperty("--rx", `${(0.5 - y) * 5}deg`);
        element.style.setProperty("--ry", `${(x - 0.5) * 7}deg`);
        element.style.setProperty("--mx", `${x * 100}%`);
        element.style.setProperty("--my", `${y * 100}%`);
      }}
      onPointerLeave={() => {
        const element = ref.current;
        if (!element) return;
        element.style.setProperty("--rx", "0deg");
        element.style.setProperty("--ry", "0deg");
      }}
    >
      {children}
    </div>
  );
}

/** Thin progress bar that tracks reading position. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      ref.current?.style.setProperty("transform", `scaleX(${progress})`);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="scroll-progress" aria-hidden="true" />;
}
