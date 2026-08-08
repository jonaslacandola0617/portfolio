import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SearchProvider } from "@/hooks/use-search";
import { ToastProvider } from "@/components/ui/toast";
import { getSearchIndex } from "@/lib/content";
import { getSiteSettings } from "@/lib/db/queries/settings";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ibm-plex-mono", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `${settings.name} — ${settings.role}`;

  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: { default: title, template: `%s — ${settings.name}` },
    description: siteConfig.description,
    alternates: { canonical: "/" },
    keywords: ["cybersecurity portfolio", "SOC analyst", "network engineer", "CCNA", "Google Cybersecurity", "packet tracer", "wireshark"],
    authors: [{ name: settings.name }],
    creator: settings.name,
    openGraph: {
      type: "website",
      title,
      description: siteConfig.description,
      url: siteConfig.siteUrl,
      siteName: settings.name,
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description: siteConfig.description,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [searchIndex, settings] = await Promise.all([getSearchIndex(), getSiteSettings()]);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, spaceGrotesk.variable, ibmPlexMono.variable, "font-body")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
