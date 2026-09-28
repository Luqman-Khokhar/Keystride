import Link from "next/link";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { AccountLink } from "./AccountLink";

const navCls =
  "flex items-center gap-2 rounded-lg p-2 text-sub transition-colors hover:text-text focus-visible:text-text focus-visible:outline-2 focus-visible:outline-main active:opacity-70";

export function SiteHeader() {
  return (
    <header className="flex items-center gap-2">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-main"
      >
        <span aria-hidden="true" className="text-2xl text-main">
          ⌨
        </span>
        <span className="text-2xl text-text">
          key<span className="text-main">stride</span>
        </span>
      </Link>

      <nav aria-label="Main" className="ml-auto flex items-center gap-1">
        <Link href="/competitions" className={navCls}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22V4a1 1 0 0 1 .6-.9C6 2.5 7.3 2 9 2c3 0 4 2 7 2 1.2 0 2.2-.2 3.1-.6a.6.6 0 0 1 .9.5V14a1 1 0 0 1-.6.9c-1 .4-2.1.6-3.4.6-3 0-4-2-7-2-1.9 0-3.3.5-5 1.4" />
          </svg>
          <span className="text-sm max-sm:sr-only">compete</span>
        </Link>
        <Link href="/leaderboard" className={navCls}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
            <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
          </svg>
          <span className="text-sm max-sm:sr-only">leaderboard</span>
        </Link>
        <AccountLink />
        <SettingsDialog />
      </nav>
    </header>
  );
}
