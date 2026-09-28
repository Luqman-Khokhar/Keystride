import type { MetadataRoute } from "next";
import { PRESETS } from "@/lib/presets";
import { apiGet, SITE_URL } from "@/lib/site";

// Rebuild hourly so new profiles and competitions show up.
export const revalidate = 3600;

interface SitemapFeed {
  users: { username: string; lastModified?: string }[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...PRESETS.map((p) => ({
      url: `${SITE_URL}/typing-test/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${SITE_URL}/leaderboard`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
    { url: `${SITE_URL}/competitions`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
  ];

  // API down at build/refresh time → still serve the static pages.
  const feed = await apiGet<SitemapFeed>("/sitemap", 3600);
  if (feed) {
    for (const u of feed.users) {
      pages.push({ url: `${SITE_URL}/u/${encodeURIComponent(u.username)}`, lastModified: u.lastModified, changeFrequency: "weekly", priority: 0.4 });
    }
  }
  return pages;
}
