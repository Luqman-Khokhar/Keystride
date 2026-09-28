import type { Metadata } from "next";
import { ProfileView } from "@/components/account/ProfileView";

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${decodeURIComponent(username)}'s typing profile`,
    description: `Typing speed personal bests and stats for ${decodeURIComponent(username)}.`,
  };
}

export default async function ProfilePage({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;
  return (
    <main className="flex flex-1 flex-col py-10">
      <ProfileView username={decodeURIComponent(username)} />
    </main>
  );
}
