import type { Metadata } from "next";
import { CompetitionView } from "@/components/competitions/CompetitionView";
import { openGraph } from "@/lib/seo";

const API_URL = process.env.API_URL?.replace(/\/$/, "") || "http://localhost:4000";

/** Title/description for link previews when someone shares an invite. */
export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const fallback: Metadata = { title: "Typing competition", robots: { index: false } };
  if (!/^[A-Za-z0-9]{6,12}$/.test(slug)) return fallback;
  try {
    const res = await fetch(`${API_URL}/api/competitions/${slug}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return fallback;
    const c = (await res.json()) as { title: string; creator: string; config: { mode: string; amount: number } };
    const test = `${c.config.mode} ${c.config.amount}`;
    return {
      title: c.title,
      description: `Join ${c.creator}'s typing competition on Keystride (${test}). Best verified score wins.`,
      robots: { index: false },
      openGraph: openGraph({ title: `${c.title} — typing competition`, description: `Hosted by ${c.creator} · ${test}`, url: `/c/${slug}` }),
    };
  } catch {
    return fallback;
  }
}

export default async function CompetitionPage({ params }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  return (
    <main className="flex flex-1 flex-col py-10">
      <CompetitionView slug={slug} />
    </main>
  );
}
