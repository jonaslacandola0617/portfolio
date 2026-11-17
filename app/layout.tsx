import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./public-redesign.css";
import "./public-pages.css";
import "./public-components.css";
import "./public-finishing.css";
import "./public-tokens.css";
import "./public-tweaks.css";
import "./public-modal-layer.css";
import "./public-theme.css";
import "./site.css";
import "./admin-clean.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SearchProvider } from "@/hooks/use-search";
import { ToastProvider } from "@/components/ui/toast";
import { getSearchIndex } from "@/lib/content";
import { getSiteSettings } from "@/lib/db/queries/settings";

// Three families only: a characterful display face, a neutral reading face, and a mono for data.
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `${settings.name} — ${settings.role}`;

  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: { default: title, template: `%s — ${settings.name}` },
    description: siteConfig.description,
    keywords: [
      "Jonas Lacandola",
      "IT support",
      "technical support",
      "help desk",
      "network administrator",
      "networking portfolio",
      "cybersecurity portfolio",
      "SOC analyst",
      "CCNA",
      "Cisco",
      "Linux",
      "Google Cybersecurity Certificate",
      "IT Philippines",
    ],
    authors: [{ name: settings.name }],
    creator: settings.name,
    category: "technology",
    robots: { index: true, follow: true },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      shortcut: ["/icon.svg"],
    },
    openGraph: {
      type: "website",
      title,
      description: siteConfig.description,
      url: siteConfig.siteUrl,
      siteName: settings.name,
      locale: "en_US",
      images: [
        {
          url: "/api/og",
          width: 1200,
          height: 630,
          alt: `${settings.name} — ${settings.role}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: siteConfig.description,
      images: ["/api/og"],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [searchIndex, settings] = await Promise.all([getSearchIndex(), getSiteSettings()]);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(display.variable, sans.variable, mono.variable, "font-body")}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <ToastProvider>
            <SearchProvider index={searchIndex}>
              <SiteChrome settings={settings}>{children}</SiteChrome>
            </SearchProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
