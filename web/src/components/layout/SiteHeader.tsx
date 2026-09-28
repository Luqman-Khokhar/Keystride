import Link from "next/link";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { FlagIcon, LogoMark, TrophyIcon } from "@/components/ui/icons";
import { AccountLink } from "./AccountLink";

const navCls =
  "flex items-center gap-2 rounded-control px-2.5 py-2 text-sm text-sub transition-colors duration-150 hover:bg-surface hover:text-text focus-visible:text-text focus-visible:outline-2 focus-visible:outline-main active:bg-bg-alt";

export function SiteHeader() {
  return (
    <header className="flex items-center gap-2">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-main"
      >
        <LogoMark className="size-7 text-main" />
        <span className="text-xl font-semibold tracking-tight text-text">Keystride</span>
      </Link>

      <nav aria-label="Main" className="ml-auto flex items-center gap-0.5">
        <Link href="/competitions" className={navCls}>
          <FlagIcon className="size-4.5" />
          <span className="max-sm:sr-only">Compete</span>
        </Link>
        <Link href="/leaderboard" className={navCls}>
          <TrophyIcon className="size-4.5" />
          <span className="max-sm:sr-only">Leaderboard</span>
        </Link>
        <AccountLink />
        <SettingsDialog />
      </nav>
    </header>
  );
}
