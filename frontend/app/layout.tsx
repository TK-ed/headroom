import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { themeScript } from "@/components/layout/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "HeadRoom",
  description: "Day-ahead GB wind forecasts and how far to trust them.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <TooltipProvider delayDuration={200}>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="border-t py-6 text-xs text-muted-foreground">
              Source: Elexon BMRS. FUELHH (actual wind, half-hourly) and WINDFOR (wind forecast, hourly). All times
              are UK local.
            </p>
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}
