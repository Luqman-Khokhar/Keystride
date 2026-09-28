"use client";

import dynamic from "next/dynamic";

/** Same footprint as the live test so nothing shifts when it mounts. */
function TypingTestSkeleton() {
  return (
    <div className="flex w-full flex-col items-center gap-6" aria-busy="true" aria-label="Loading typing test">
      <div className="h-9 w-full max-w-xl animate-pulse rounded-lg bg-bg-alt motion-reduce:animate-none" />
      <div className="flex w-full flex-col gap-2">
        <div className="h-8" />
        <div className="words-window flex flex-col justify-around">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-bg-alt motion-reduce:animate-none"
              style={{ width: `${[92, 85, 60][i]}%` }}
            />
          ))}
        </div>
      </div>
      <div className="size-11" />
    </div>
  );
}

// Random words + localStorage settings exist only in the browser, so skip SSR
// for the test itself; the page shell and SEO content still render on the server.
export const TypingTestLoader = dynamic<{ initialConfig?: import("@keystride/engine").TestConfig }>(() => import("./TypingTest"), {
  ssr: false,
  loading: TypingTestSkeleton,
});
