"use client";

import { buttonCls } from "@/components/ui/states";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Something went wrong</h1>
      <p className="text-sub">We couldn&apos;t load this page. It&apos;s usually temporary.</p>
      <button type="button" onClick={reset} className={buttonCls}>
        Try again
      </button>
    </main>
  );
}
