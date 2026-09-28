import Link from "next/link";
import { PRESETS } from "@/lib/presets";
import { jsonLd } from "@/lib/site";

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

const SPEEDS = [
  ["under 30", "beginner — still finding keys"],
  ["30–50", "average everyday typist"],
  ["50–70", "above average"],
  ["70–100", "fast — touch typing"],
  ["100+", "exceptional"],
];

/** SEO-friendly content below the test: explanation, benchmarks, tips, FAQ, internal links. */
export function TestGuide({ intro, currentSlug }: { intro?: string; currentSlug?: string }) {
  const others = PRESETS.filter((p) => p.slug !== currentSlug);

  return (
    <section aria-labelledby="guide-title" className="mx-auto flex w-full max-w-3xl flex-col gap-10 border-t border-sub-alt py-16 text-sub">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      })} />

      <div className="flex flex-col gap-3">
        <h2 id="guide-title" className="text-xl text-text">
          about this typing test
        </h2>
        {intro && <p>{intro}</p>}
        <p>
          Type the words as they appear; the timer starts with your first key. Mistakes are highlighted as you go, and you can
          backspace into a word you got wrong. When the test ends you get your WPM, accuracy, raw speed, consistency and a
          second-by-second graph.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl text-text">what&apos;s a good typing speed?</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-xs border-collapse text-left text-sm">
            <caption className="sr-only">Typing speed benchmarks</caption>
            <thead>
              <tr>
                <th scope="col" className="py-2 pr-6 font-normal text-sub">words per minute</th>
                <th scope="col" className="py-2 font-normal text-sub">level</th>
              </tr>
            </thead>
            <tbody>
              {SPEEDS.map(([wpm, level]) => (
                <tr key={wpm} className="border-t border-sub-alt">
                  <td className="py-2 pr-6 tabular-nums text-main">{wpm}</td>
                  <td className="py-2 text-text">{level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs">A rough guide — accuracy of 95% or more matters as much as the raw number.</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl text-text">how to type faster</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Keep your fingers on the home row (ASDF / JKL;) and return to it after every word.</li>
          <li>Look at the screen, not the keyboard — touch typing is where real speed comes from.</li>
          <li>Slow down to stay above 95% accuracy; speed follows accuracy, not the other way round.</li>
          <li>Practise a little every day. Short 30 second tests repeated often beat one long session.</li>
          <li>
            Race friends in a{" "}
            <Link href="/competitions" className="text-main underline-offset-4 hover:underline">
              typing competition
            </Link>{" "}
            to stay motivated.
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl text-text">frequently asked questions</h2>
        {FAQ.map((f) => (
          <div key={f.q} className="flex flex-col gap-1">
            <h3 className="text-text">{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </div>

      <nav aria-labelledby="more-tests" className="flex flex-col gap-3">
        <h2 id="more-tests" className="text-xl text-text">
          more typing tests
        </h2>
        <ul className="flex flex-wrap gap-2">
          {currentSlug && (
            <li>
              <Link href="/" className="inline-block rounded-lg bg-bg-alt px-3 py-1.5 text-sm text-text hover:bg-sub-alt focus-visible:outline-2 focus-visible:outline-main">
                typing test
              </Link>
            </li>
          )}
          {others.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/typing-test/${p.slug}`}
                className="inline-block rounded-lg bg-bg-alt px-3 py-1.5 text-sm text-text hover:bg-sub-alt focus-visible:outline-2 focus-visible:outline-main"
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
