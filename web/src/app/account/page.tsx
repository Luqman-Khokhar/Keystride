import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <main className="flex flex-1 flex-col py-10">
      <AccountView />
    </main>
  );
}
