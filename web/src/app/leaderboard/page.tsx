import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { apiGet } from "@/lib/site";
import type { Leaderboard } from "@/store/types";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The fastest verified typists on 15 and 60 second English typing tests.",
};

export default async function LeaderboardPage() {
  // Public board rendered on the server (refreshed every 30s) so rows show on first paint;
  // the client query then takes over and adds the visitor's own rank.
  const initial = await apiGet<Leaderboard>("/leaderboard?mode=time&amount=15", 30);

  return (
    <main className="flex flex-1 flex-col py-10">
      <LeaderboardView initial={initial} />
    </main>
  );
}
