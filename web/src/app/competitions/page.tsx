import type { Metadata } from "next";
import { CompetitionList } from "@/components/competitions/CompetitionList";

export const metadata: Metadata = {
  title: "Typing competitions",
  description: "Join live typing competitions or create your own and race friends on the same text.",
};

export default function CompetitionsPage() {
  return (
    <main className="flex flex-1 flex-col py-10">
      <CompetitionList />
    </main>
  );
}
