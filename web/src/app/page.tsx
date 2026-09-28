import { TypingTestLoader } from "@/components/typing/TypingTestLoader";

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col justify-center py-10">
        <h1 className="sr-only">Typing speed test</h1>
        <TypingTestLoader />
      </main>

      <footer className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-sub">
        <span>
          <kbd className="rounded bg-bg-alt px-1.5 py-0.5 text-text">tab</kbd> +{" "}
          <kbd className="rounded bg-bg-alt px-1.5 py-0.5 text-text">enter</kbd> — restart test
        </span>
        <span>
          <kbd className="rounded bg-bg-alt px-1.5 py-0.5 text-text">space</kbd> — next word
        </span>
      </footer>
    </>
  );
}
