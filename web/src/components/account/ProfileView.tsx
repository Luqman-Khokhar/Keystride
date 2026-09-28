"use client";

import Link from "next/link";
import { errorMessage, errorStatus, useGetProfileQuery } from "@/store/api";
import { ErrorState, linkCls, Skeleton } from "@/components/ui/states";
import { PersonalBests } from "./PersonalBests";
import { ProfileStats } from "./ProfileStats";

export function ProfileView({ username }: { username: string }) {
  const { data, error, isLoading, refetch } = useGetProfileQuery(username);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading profile">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-80 max-w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (errorStatus(error) === 404) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="text-2xl text-text">user not found</h1>
        <p className="text-sub">
          No one goes by &ldquo;{username}&rdquo;.{" "}
          <Link href="/leaderboard" className={linkCls}>
            Browse the leaderboard
          </Link>
          .
        </p>
      </div>
    );
  }
  if (error || !data) return <ErrorState message={errorMessage(error, "Couldn't load this profile")} onRetry={refetch} />;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl text-text">{data.username}</h1>
        <ProfileStats joined={data.createdAt} tests={data.tests} timeMs={data.timeMs} />
      </div>
      <section aria-labelledby="profile-pb" className="flex flex-col gap-4">
        <h2 id="profile-pb" className="text-xl text-text">
          personal bests
        </h2>
        <PersonalBests bests={data.bests} />
      </section>
    </div>
  );
}
