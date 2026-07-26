import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SearchProvider } from "@/hooks/use-search";
import { getSearchIndex } from "@/lib/content";
import { getSiteSettings } from "@/lib/db/queries/settings";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
      default: `${settings.name} — ${settings.role}`,
      template: `%s — ${settings.name}`,
    },
    description: siteConfig.description,
    keywords: [
      "cybersecurity portfolio",
      "SOC analyst",
      "network engineer",
      "CCNA",
      "Google Cybersecurity",
      "packet tracer",
      "wireshark",
    ],
    authors: [{ name: settings.name }],
    openGraph: {
      type: "website",
      title: `${settings.name} — ${settings.role}`,
      description: siteConfig.description,
      siteName: settings.name,
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.name} — ${settings.role}`,
      description: siteConfig.description,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [searchIndex, settings] = await Promise.all([getSearchIndex(), getSiteSettings()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          spaceGrotesk.variable,
          jetbrainsMono.variable,
          "font-sans"
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SearchProvider index={searchIndex}>
            <SiteChrome settings={settings}>{children}</SiteChrome>
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
