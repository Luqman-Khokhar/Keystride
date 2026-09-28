import type { Metadata } from "next";
import { CompetitionList } from "@/components/competitions/CompetitionList";
import { apiGet } from "@/lib/site";
import type { CompetitionPage } from "@/store/types";

export const metadata: Metadata = {
  title: "Typing competitions",
  description: "Join live typing competitions or create your own and race friends on the same text.",
};

export default async function CompetitionsPage() {
  // Live public competitions rendered on the server (refreshed every 30s) for a real first paint.
  const initial = await apiGet<CompetitionPage>("/competitions?status=live&limit=12", 30);

  return (
    <main className="flex flex-1 flex-col py-10">
      <CompetitionList initial={initial} />
    </main>
  );
}
