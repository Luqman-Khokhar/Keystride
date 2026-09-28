import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SETTINGS_BOOT_SCRIPT } from "@/lib/settings/settings";
import { StoreProvider } from "@/store/StoreProvider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Keystride — Typing Speed Test", template: "%s · Keystride" },
  applicationName: "Keystride",
  description:
    "Fast, minimal typing speed test. Measure your words per minute, accuracy, and consistency with timed and word-count tests.",
};

export const viewport: Viewport = {
  themeColor: "#1e1f22",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Boot script sets theme vars + data attributes on <html> before paint.
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SETTINGS_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg font-mono text-text">
        <StoreProvider>
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-8">
            <SiteHeader />
            {children}
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
