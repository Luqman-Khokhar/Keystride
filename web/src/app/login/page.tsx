import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForms } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create an account to save your typing results and join the leaderboard.",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
      <h1 className="sr-only">Sign in or create an account</h1>
      <Suspense>
        <AuthForms />
      </Suspense>
    </main>
  );
}
