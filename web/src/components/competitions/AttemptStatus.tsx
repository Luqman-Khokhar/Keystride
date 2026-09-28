"use client";

import { useEffect, useRef } from "react";
import type { ResultSubmission } from "@keystride/engine";
import { errorMessage, useSubmitAttemptMutation } from "@/store/api";
import { ShareActions } from "@/components/ui/ShareActions";
import { buttonCls, Spinner } from "@/components/ui/states";

/** Submits one finished competition attempt and reports the verdict. */
export function AttemptStatus({ slug, submission }: { slug: string; submission: ResultSubmission }) {
  const [submit, { data, error, isLoading, isUninitialized, reset }] = useSubmitAttemptMutation();
  const sent = useRef<ResultSubmission | null>(null);

  useEffect(() => {
    // StrictMode runs effects twice in development; submit each attempt once.
    if (sent.current === submission) return;
    sent.current = submission;
    submit({ slug, submission });
  }, [slug, submission, submit]);

  let content: React.ReactNode;
  if (isLoading || isUninitialized) content = <Spinner label="Submitting attempt…" />;
  else if (error) {
    content = (
      <p className="flex flex-wrap items-center justify-center gap-3 text-error">
        <span>
          <span aria-hidden="true">⚠ </span>
          {errorMessage(error, "Couldn't submit this attempt")}
        </span>
        <button
          type="button"
          onClick={() => {
            reset();
            submit({ slug, submission });
          }}
          className={buttonCls}
        >
          Retry
        </button>
      </p>
    );
  } else if (data) {
    const left =
      data.attemptsLeft === null ? null : `${data.attemptsLeft} attempt${data.attemptsLeft === 1 ? "" : "s"} left`;
    content = data.counted ? (
      <div className="flex flex-col items-center gap-3">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sub">
          <span>
            <span aria-hidden="true">✓ </span>Counted
          </span>
          {data.improved && <span className="rounded bg-main px-2 py-0.5 text-bg">new best in this competition!</span>}
          {data.rank !== null && (
            <span>
              you&apos;re <span className="text-main">#{data.rank}</span> with {Math.round(data.best ?? 0)} wpm
            </span>
          )}
          {left && <span>· {left}</span>}
        </p>
        <ShareActions
          path={`/r/${data.resultId}`}
          title={`${Math.round(data.wpm)} WPM on Keystride`}
          text={`I typed ${Math.round(data.wpm)} WPM in a Keystride typing competition. Can you beat it?`}
          copyLabel="copy result link"
        />
      </div>
    ) : (
      <p className="text-sub">
        <span aria-hidden="true">⚑ </span>
        Recorded but not counted: {data.flagReason}.{left && ` ${left}.`}
      </p>
    );
  }

  return (
    <div aria-live="polite" className="flex min-h-9 items-center justify-center text-center text-sm">
      {content}
    </div>
  );
}
