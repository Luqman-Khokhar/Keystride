import type { Metadata } from "next";
import { TestPage } from "@/components/seo/TestPage";
import { jsonLd, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: SITE_NAME,
          url: SITE_URL,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Any",
          description: "Free, minimal typing speed test with live WPM, accuracy, themes, a verified leaderboard and typing competitions.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        })}
      />
      <TestPage
        h1="Typing speed test"
        intro="Keystride is a free typing speed test. Pick a time (15 to 120 seconds) or a word count (10 to 100), add punctuation or numbers if you like, and start typing. Your settings are remembered on this device."
      />
    </>
  );
}
