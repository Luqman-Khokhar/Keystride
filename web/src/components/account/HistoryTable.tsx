"use client";

import Link from "next/link";
import { formatDateTime, testLabel } from "@/lib/format";
import { errorMessage, useGetHistoryInfiniteQuery } from "@/store/api";
import { ShieldAlertIcon, StarIcon } from "@/components/ui/icons";
import { buttonCls, EmptyState, ErrorState, linkCls, Skeleton, Spinner } from "@/components/ui/states";

export function HistoryTable() {
  const { data, error, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useGetHistoryInfiniteQuery();
  const rows = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading history">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (error && !rows.length) {
    return <ErrorState message={errorMessage(error, "Couldn't load your results")} onRetry={refetch} />;
  }
  if (!rows.length) {
    return (
      <EmptyState title="No saved tests yet.">
        <Link href="/" className={linkCls}>
          Take your first test
        </Link>{" "}
        — results save automatically while you&apos;re signed in.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-xl border-collapse text-left text-sm">
          <caption className="sr-only">Your recent tests, newest first</caption>
          <thead className="text-sub">
            <tr>
              <th scope="col" className="px-3 py-2 text-right font-medium">WPM</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Raw</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Accuracy</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Consistency</th>
              <th scope="col" className="px-3 py-2 font-medium">Test</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line tabular-nums">
                <td className="px-3 py-2 text-right text-main">
                  {r.isPb && (
                    <span className="mr-2 inline-flex align-middle" title="Personal best">
                      <StarIcon className="size-3.5" />
                      <span className="sr-only">personal best,</span>
                    </span>
                  )}
                  {r.wpm.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">{r.rawWpm.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{r.accuracy.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right">{r.consistency.toFixed(1)}%</td>
                <td className="px-3 py-2 text-sub">
                  {testLabel(r)}
                  {r.flagged && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-error" title="Failed verification; not counted for records">
                      <ShieldAlertIcon className="size-3.5" />
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-sub">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center gap-2 text-sm text-sub">
        <p>
          Showing {rows.length} test{rows.length === 1 ? "" : "s"}
          {hasNextPage ? "" : " — that's all of them"}.
        </p>
        {error && <p className="text-error">{errorMessage(error, "Couldn't load more results")}</p>}
        {hasNextPage &&
          (isFetchingNextPage ? (
            <Spinner label="Loading more…" />
          ) : (
            <button type="button" onClick={() => fetchNextPage()} className={buttonCls}>
              Load more
            </button>
          ))}
      </div>
    </div>
  );
}
