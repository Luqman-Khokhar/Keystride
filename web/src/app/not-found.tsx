import Link from "next/link";
import { StatusPage } from "@/components/ui/StatusPage";
import { ghostButtonCls, primaryButtonCls } from "@/components/ui/states";

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Page not found"
      actions={
        <>
          <Link href="/" className={primaryButtonCls}>
            Take a typing test
          </Link>
          <Link href="/leaderboard" className={ghostButtonCls}>
            See the leaderboard
          </Link>
        </>
      }
    >
      The link may be wrong, or the page no longer exists.
    </StatusPage>
  );
}
