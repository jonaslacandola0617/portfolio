import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx,mdx}", "./components/**/*.{ts,tsx}", "./content/**/*.{md,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)", graphite: "var(--graphite)", charcoal: "var(--charcoal)",
        surface: "var(--surface)", "surface-2": "var(--surface-2)", "surface-3": "var(--surface-3)",
        bone: "var(--bone)", paper: "var(--paper)", border: "var(--border)", "border-strong": "var(--border-strong)",
        muted: "var(--muted)", "muted-foreground": "var(--muted)",
        text: "var(--text)", "text-dim": "var(--text-dim)", cobalt: "var(--cobalt)", "cobalt-dim": "var(--cobalt-dim)",
        vermilion: "var(--vermilion)", "vermilion-dim": "var(--vermilion-dim)", signal: "var(--signal-yellow)", teal: "var(--signal-teal)",
        background: "var(--surface)", foreground: "var(--text)", input: "var(--border)", ring: "var(--cobalt)",
        primary: { DEFAULT: "var(--cobalt)", foreground: "#ffffff" },
        secondary: { DEFAULT: "var(--surface-3)", foreground: "var(--text)" },
        accent: { DEFAULT: "var(--surface-3)", foreground: "var(--text)" },
        card: { DEFAULT: "var(--surface-2)", foreground: "var(--text)" },
        popover: { DEFAULT: "var(--surface-2)", foreground: "var(--text)" },
        success: { DEFAULT: "var(--signal-teal)", foreground: "#ffffff" },
        warning: { DEFAULT: "var(--signal-yellow)", foreground: "var(--ink)" },
        destructive: { DEFAULT: "var(--vermilion)", foreground: "#ffffff" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "'Space Grotesk'", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: { xs: "2px", sm: "4px", md: "6px", lg: "10px" },
      maxWidth: { content: "68ch" },
      transitionTimingFunction: { signal: "cubic-bezier(0.16, 1, 0.3, 1)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "pulse-node": { "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
      },
      animation: {
        "accordion-down": "accordion-down .2s ease-out", "accordion-up": "accordion-up .2s ease-out",
        "fade-up": "fade-up .5s cubic-bezier(.16,1,.3,1) both", "fade-in": "fade-in .2s ease-out both",
        "pulse-dot": "pulse-node 2.4s ease-in-out infinite", "pulse-node": "pulse-node 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
