import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PersonalBests } from "@/components/account/PersonalBests";
import { ProfileStats } from "@/components/account/ProfileStats";
import { primaryButtonCls } from "@/components/ui/states";
import { openGraph } from "@/lib/seo";
import { apiGetOrNotFound } from "@/lib/site";
import type { Profile } from "@/store/types";

const USERNAME = /^[a-zA-Z0-9_]{3,20}$/;

// Shared by generateMetadata and the page within one request.
const getProfile = cache(async (username: string) =>
  USERNAME.test(username) ? apiGetOrNotFound<Profile>(`/users/${encodeURIComponent(username)}`) : null,
);

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const username = decodeURIComponent((await params).username);
  const p = await getProfile(username);
  if (!p) return { title: "User not found", robots: { index: false } };
  const best60 = p.bests.find((b) => b.config.mode === "time" && b.config.amount === 60 && !b.config.punctuation && !b.config.numbers);
  const description = best60
    ? `${p.username} types ${Math.round(best60.wpm)} WPM on the 1 minute typing test. ${p.tests} tests completed on Keystride.`
    : `${p.username}'s typing speed personal bests and stats on Keystride.`;
  return {
    title: `${p.username}'s typing profile`,
    description,
    alternates: { canonical: `/u/${p.username}` },
    openGraph: openGraph({ title: `${p.username} on Keystride`, description, url: `/u/${p.username}`, type: "profile" }),
  };
}

export default async function ProfilePage({ params }: PageProps<"/u/[username]">) {
  const p = await getProfile(decodeURIComponent((await params).username));
  if (!p) notFound();

  return (
    <main className="flex flex-1 flex-col py-10">
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl text-text">{p.username}</h1>
          <ProfileStats joined={p.createdAt} tests={p.tests} timeMs={p.timeMs} />
        </div>
        <section aria-labelledby="profile-pb" className="flex flex-col gap-4">
          <h2 id="profile-pb" className="text-xl text-text">
            personal bests
          </h2>
          <PersonalBests bests={p.bests} />
        </section>
        <div>
          <Link href="/" className={primaryButtonCls}>
            Test your own typing speed
          </Link>
        </div>
      </div>
    </main>
  );
}
