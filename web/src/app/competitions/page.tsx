import type { Metadata } from "next";
import { RaceIntro } from "@/components/race/RaceIntro";

export const metadata: Metadata = {
  title: "Typing races",
  description: "Start a live typing race, share the link and race friends on the same text.",
};

export default function CompetitionsPage() {
  return (
    <main className="flex flex-1 flex-col py-10">
      <RaceIntro />
    </main>
  );
}
