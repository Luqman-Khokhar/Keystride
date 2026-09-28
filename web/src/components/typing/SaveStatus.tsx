"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ResultSubmission } from "@keystride/engine";
import { errorMessage, useGetMeQuery, useSubmitResultMutation } from "@/store/api";
import { AlertIcon, CheckIcon, ShieldAlertIcon } from "@/components/ui/icons";
import { ShareActions } from "@/components/ui/ShareActions";
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
        <span className="inline-flex items-center gap-1.5">
          <AlertIcon className="size-4" />
          {errorMessage(error, "Couldn't save this result")}
        </span>
        <button type="button" onClick={retry} className={buttonCls}>
          Retry
        </button>
      </p>
    );
  } else if (data) {
    content = data.counted ? (
      <div className="flex flex-col items-center gap-3">
        <p className="flex items-center gap-1.5 text-sub">
          <CheckIcon className="size-4" />
          Saved
          {data.isPb && <span className="ml-2 rounded-full bg-main-soft px-2.5 py-0.5 font-medium text-main">New personal best</span>}
        </p>
        <ShareActions
          path={`/r/${data.id}`}
          title={`${Math.round(data.wpm)} WPM on Keystride`}
          text={`I typed ${Math.round(data.wpm)} WPM with ${Math.round(data.accuracy)}% accuracy on Keystride. Can you beat it?`}
          copyLabel="Copy result link"
        />
      </div>
    ) : (
      <p className="flex items-center gap-1.5 text-sub">
        <ShieldAlertIcon className="size-4" />
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
