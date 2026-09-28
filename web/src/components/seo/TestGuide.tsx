import Link from "next/link";
import { PRESETS } from "@/lib/presets";
import { jsonLd } from "@/lib/site";
import { PlusIcon } from "@/components/ui/icons";
import { buttonCls, linkCls } from "@/components/ui/states";
import { SpeedScale, type SpeedLevel } from "./SpeedScale";

export const FAQ = [
  {
    q: "How is typing speed (WPM) calculated?",
    a: "Words per minute counts every 5 correctly typed characters, including spaces, as one word, then divides by the test time in minutes. Only fully correct words count toward WPM; raw WPM counts everything you typed.",
  },
  {
    q: "What is a good typing speed?",
    a: "Around 40 WPM is a common everyday speed. 60 WPM or more is comfortably above average, 80+ is fast, and 100+ is exceptional. Accuracy matters as much as speed: aim for 95% or better.",
  },
  {
    q: "What does consistency mean?",
    a: "Consistency measures how steady your speed was from second to second. 100% means a perfectly even rhythm; lower numbers mean bursts and pauses.",
  },
  {
    q: "Are the results saved?",
    a: "Tests work without an account. Sign in to save every result, track personal bests, appear on the leaderboard and join competitions.",
  },
];

const SPEEDS: SpeedLevel[] = [
  { range: "under 30", label: "Beginner, still finding keys", from: 0 },
  { range: "30–50", label: "Average everyday typist", from: 30 },
  { range: "50–70", label: "Above average", from: 50 },
  { range: "70–100", label: "Fast, touch typing", from: 70 },
  { range: "100+", label: "Exceptional", from: 100 },
];

/** SEO-friendly content below the test: explanation, benchmarks, tips, FAQ, internal links. */
export function TestGuide({ intro, currentSlug }: { intro?: string; currentSlug?: string }) {
  const others = PRESETS.filter((p) => p.slug !== currentSlug);

  return (
    <section aria-labelledby="guide-title" className="mx-auto flex w-full max-w-2xl flex-col gap-12 border-t border-line py-16 leading-relaxed text-sub">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      })} />

      <div className="flex flex-col gap-3">
        <h2 id="guide-title" className="text-xl font-semibold tracking-tight text-text">
          About this typing test
        </h2>
        {intro && <p>{intro}</p>}
        <p>
          Type the words as they appear; the timer starts with your first key. Mistakes are highlighted as you go, and you can
          backspace into a word you got wrong. When the test ends you get your WPM, accuracy, raw speed, consistency and a
          second-by-second graph.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-text">What&apos;s a good typing speed?</h2>
        <SpeedScale levels={SPEEDS} />
        <p className="text-xs">A rough guide — accuracy of 95% or more matters as much as the raw number.</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-text">How to type faster</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Keep your fingers on the home row (ASDF / JKL;) and return to it after every word.</li>
          <li>Look at the screen, not the keyboard — touch typing is where real speed comes from.</li>
          <li>Slow down to stay above 95% accuracy; speed follows accuracy, not the other way round.</li>
          <li>Practise a little every day. Short 30 second tests repeated often beat one long session.</li>
          <li>
            Race friends in a{" "}
            <Link href="/competitions" className={linkCls}>
              typing competition
            </Link>{" "}
            to stay motivated.
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-text">Frequently asked questions</h2>
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            // Answers stay in the HTML (and the FAQ JSON-LD) while collapsed.
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-control py-3 font-medium text-text focus-visible:outline-2 focus-visible:outline-main [&::-webkit-details-marker]:hidden">
                <h3>{f.q}</h3>
                <PlusIcon className="size-4 text-sub transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" />
              </summary>
              <p className="pb-4">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <nav aria-labelledby="more-tests" className="flex flex-col gap-3">
        <h2 id="more-tests" className="text-xl font-semibold tracking-tight text-text">
          More typing tests
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {currentSlug && (
            <li>
              <Link href="/" className={`${buttonCls} w-full justify-start`}>
                Typing test
              </Link>
            </li>
          )}
          {others.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/typing-test/${p.slug}`}
                className={`${buttonCls} w-full justify-start`}
              >
                {p.h1}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
