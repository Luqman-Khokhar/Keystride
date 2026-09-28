import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The fastest verified typists on 15 and 60 second English typing tests.",
};

export default function LeaderboardPage() {
  return (
    <main className="flex flex-1 flex-col py-10">
      <LeaderboardView />
    </main>
  );
}
