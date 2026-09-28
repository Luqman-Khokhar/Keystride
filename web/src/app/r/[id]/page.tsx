import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultChart } from "@/components/typing/ResultChart";
import { ShareActions } from "@/components/ui/ShareActions";
import { linkCls, primaryButtonCls } from "@/components/ui/states";
import { formatDate, testLabel } from "@/lib/format";
import { getPublicResult, presetPathFor } from "@/lib/results";
import { openGraph } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/r/[id]">): Promise<Metadata> {
  const r = await getPublicResult((await params).id);
  if (!r) return { title: "Result not found", robots: { index: false } };
  const title = `${Math.round(r.wpm)} WPM by ${r.username}`;
  const description = `${r.username} typed ${Math.round(r.wpm)} words per minute with ${Math.round(r.accuracy)}% accuracy on a ${testLabel(r)} typing test. Can you beat it?`;
  return {
    title,
    description,
    // Individual results are thin pages: shareable, but not worth indexing.
    robots: { index: false, follow: true },
    // This route has its own opengraph-image (the score card).
    openGraph: openGraph({ title: `${title} · Keystride`, description, url: `/r/${r.id}`, image: false }),
  };
}

export default async function ResultPage({ params }: PageProps<"/r/[id]">) {
  const r = await getPublicResult((await params).id);
  if (!r) notFound();

  const wpm = Math.round(r.wpm);
  const stats: [string, string, string?][] = [
    ["raw", String(Math.round(r.rawWpm)), "Speed counting every typed character"],
    ["consistency", `${Math.round(r.consistency)}%`, "How steady the speed was"],
    ["characters", `${r.chars.correct}/${r.chars.incorrect}/${r.chars.extra}/${r.chars.missed}`, "correct / incorrect / extra / missed"],
    ["time", `${(r.durationMs / 1000).toFixed(r.durationMs % 1000 ? 1 : 0)}s`],
  ];

  return (
    <main className="flex flex-1 flex-col items-center py-10">
      <article className="flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl text-text">
            <Link href={`/u/${r.username}`} className="text-main hover:underline focus-visible:outline-2 focus-visible:outline-main">
              {r.username}
            </Link>
            &apos;s typing result
          </h1>
          <p className="text-sm text-sub">
            {testLabel(r)} · {r.language} · {formatDate(r.createdAt)}
            {r.isPb && <span className="ml-2 rounded bg-main px-2 py-0.5 text-xs text-bg">personal best</span>}
            {r.competitionSlug && (
              <>
                {" · "}
                <Link href={`/c/${r.competitionSlug}`} className={linkCls}>
                  from a competition
                </Link>
              </>
            )}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <dl className="flex gap-8 md:flex-col md:gap-4">
            <div>
              <dt className="text-2xl text-sub">wpm</dt>
              <dd className="text-6xl leading-none text-main">{wpm}</dd>
            </div>
            <div>
              <dt className="text-2xl text-sub">acc</dt>
              <dd className="text-6xl leading-none text-main">{Math.round(r.accuracy)}%</dd>
            </div>
          </dl>
          {r.samples.length > 0 && <ResultChart samples={r.samples} />}
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(([label, value, hint]) => (
            <div key={label} title={hint}>
              <dt className="text-sm text-sub">{label}</dt>
              <dd className="text-2xl text-main">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col items-center gap-4 border-t border-sub-alt pt-8">
          <Link href={presetPathFor(r)} className={primaryButtonCls}>
            Beat {wpm} wpm — take this test
          </Link>
          <ShareActions
            path={`/r/${r.id}`}
            title={`${wpm} WPM on Keystride`}
            text={`${r.username} typed ${wpm} WPM (${Math.round(r.accuracy)}% accuracy) on Keystride. Can you beat it?`}
          />
        </div>
      </article>
    </main>
  );
}
