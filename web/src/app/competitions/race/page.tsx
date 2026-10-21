import type { Metadata } from "next";
import { CreateRaceForm } from "@/components/race/CreateRaceForm";

export const metadata: Metadata = {
  title: "Start a race",
  robots: { index: false },
};

export default function NewRacePage() {
  return (
    <main className="flex flex-1 flex-col items-center py-10">
      <CreateRaceForm />
    </main>
  );
}
