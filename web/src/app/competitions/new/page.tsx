import type { Metadata } from "next";
import { CreateCompetitionForm } from "@/components/competitions/CreateCompetitionForm";

export const metadata: Metadata = {
  title: "Create a competition",
  robots: { index: false },
};

export default function NewCompetitionPage() {
  return (
    <main className="flex flex-1 flex-col items-center py-10">
      <CreateCompetitionForm />
    </main>
  );
}
