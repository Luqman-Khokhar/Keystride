import type { TestConfig } from "@keystride/engine";
import { TypingTestLoader } from "@/components/typing/TypingTestLoader";
import { TestGuide } from "./TestGuide";

interface TestPageProps {
  h1: string;
  /** Home keeps the heading visually hidden to stay minimal. */
  showHeading?: boolean;
  config?: TestConfig;
  intro?: string;
  slug?: string;
}

/** Typing test filling the first screen, with explanatory content below the fold. */
export function TestPage({ h1, showHeading = false, config, intro, slug }: TestPageProps) {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex min-h-[75dvh] flex-col justify-center gap-6 py-10">
        <h1 className={showHeading ? "text-center text-lg font-medium text-sub" : "sr-only"}>{h1}</h1>
        <TypingTestLoader initialConfig={config} />
      </div>
      <TestGuide intro={intro} currentSlug={slug} />
    </main>
  );
}
