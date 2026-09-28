"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ResultSubmission } from "@keystride/engine";
import { errorMessage, useGetMeQuery, useSubmitResultMutation } from "@/store/api";
import { buttonCls, linkCls, Spinner } from "@/components/ui/states";

interface SaveStatusProps {
  submission: ResultSubmission;
}

/** Saves the finished test for signed-in users and reports the server's verdict. */
export function SaveStatus({ submission }: SaveStatusProps) {
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const [submit, { data, error, isLoading, isUninitialized, reset }] = useSubmitResultMutation();
  const sent = useRef<ResultSubmission | null>(null);

  useEffect(() => {
    // Ref guard: StrictMode double-effects must not save the same test twice.
    if (!user || sent.current === submission) return;
    sent.current = submission;
    submit(submission);
  }, [user, submission, submit]);

  const retry = () => {
    reset();
    submit(submission);
  };

  let content: React.ReactNode;
  if (userLoading) content = null;
  else if (!user) {
    content = (
      <p className="text-sub">
        <Link href="/login?next=/" className={linkCls}>
          Sign in
        </Link>{" "}
        to save results and appear on the leaderboard.
      </p>
    );
  } else if (isLoading || isUninitialized) content = <Spinner label="Saving result…" />;
  else if (error) {
    content = (
      <p className="flex flex-wrap items-center justify-center gap-3 text-error">
        <span>
          <span aria-hidden="true">⚠ </span>
          {errorMessage(error, "Couldn't save this result")}
        </span>
        <button type="button" onClick={retry} className={buttonCls}>
          Retry
        </button>
      </p>
    );
  } else if (data) {
    content = data.counted ? (
      <p className="text-sub">
        <span aria-hidden="true">✓ </span>Saved
        {data.isPb && <span className="ml-3 rounded bg-main px-2 py-0.5 text-bg">new personal best!</span>}
      </p>
    ) : (
      <p className="text-sub">
        <span aria-hidden="true">⚑ </span>
        Saved, but not counted for records: {data.flagReason}.
      </p>
    );
  }

  return (
    <div aria-live="polite" className="flex min-h-9 items-center justify-center text-center text-sm">
      {content}
    </div>
  );
}
