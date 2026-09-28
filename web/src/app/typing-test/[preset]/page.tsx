import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TestPage } from "@/components/seo/TestPage";
import { PRESETS, presetBySlug } from "@/lib/presets";
import { openGraph } from "@/lib/seo";

// Only the known presets exist; everything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return PRESETS.map((p) => ({ preset: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/typing-test/[preset]">): Promise<Metadata> {
  const p = presetBySlug((await params).preset);
  if (!p) return {};
  return {
    title: { absolute: p.title },
    description: p.description,
    alternates: { canonical: `/typing-test/${p.slug}` },
    openGraph: openGraph({ title: p.title, description: p.description, url: `/typing-test/${p.slug}` }),
  };
}

export default async function PresetPage({ params }: PageProps<"/typing-test/[preset]">) {
  const p = presetBySlug((await params).preset);
  if (!p) notFound();
  return <TestPage h1={p.h1} showHeading config={p.config} intro={p.intro} slug={p.slug} />;
}
