"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  errorMessage,
  useGetMeQuery,
  useGetSummaryQuery,
  useLogoutMutation,
} from "@/store/api";
import { buttonCls, ErrorState, ghostButtonCls, linkCls, primaryButtonCls, Skeleton } from "@/components/ui/states";
import { HistoryTable } from "./HistoryTable";
import { PersonalBests } from "./PersonalBests";
import { ProfileStats } from "./ProfileStats";

function SummarySection() {
  const { data, error, isLoading, refetch } = useGetSummaryQuery();
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading stats">
        <Skeleton className="h-12 w-80 max-w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (error || !data) return <ErrorState message={errorMessage(error, "Couldn't load your stats")} onRetry={refetch} />;
  return <PersonalBests bests={data.bests} />;
}

export function AccountView() {
  const router = useRouter();
  const { data: user, isLoading, error, refetch } = useGetMeQuery();
  const { data: summary } = useGetSummaryQuery(undefined, { skip: !user });
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading account">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (error) return <ErrorState message={errorMessage(error, "Couldn't load your account")} onRetry={refetch} />;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Account</h1>
        <p className="text-sub">Sign in to see your saved results and personal bests.</p>
        <Link href="/login?next=/account" className={primaryButtonCls}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-10">
      <section aria-labelledby="account-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 id="account-title" className="text-3xl font-semibold tracking-tight text-text">
            {user.username}
          </h1>
          <div className="flex gap-2">
            <Link href={`/u/${user.username}`} className={buttonCls}>
              Public profile
            </Link>
            <button
              type="button"
              disabled={loggingOut}
              onClick={async () => {
                await logout();
                router.replace("/");
              }}
              className={ghostButtonCls}
            >
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
        {summary && <ProfileStats joined={user.createdAt} tests={summary.tests} timeMs={summary.timeMs} />}
      </section>

      <section aria-labelledby="pb-title" className="flex flex-col gap-4">
        <h2 id="pb-title" className="text-xl font-semibold tracking-tight text-text">
          Personal bests
        </h2>
        <SummarySection />
        <p className="text-xs text-sub">
          Standard tests only (no punctuation or numbers). Results that fail verification never count.{" "}
          <Link href="/leaderboard" className={linkCls}>
            See the leaderboard
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="history-title" className="flex flex-col gap-4">
        <h2 id="history-title" className="text-xl font-semibold tracking-tight text-text">
          History
        </h2>
        <HistoryTable />
      </section>
    </div>
  );
}
