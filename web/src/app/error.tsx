"use client";

import Link from "next/link";
import { StatusPage } from "@/components/ui/StatusPage";
import { buttonCls, ghostButtonCls } from "@/components/ui/states";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatusPage
      title="Something went wrong"
      actions={
        <>
          <button type="button" onClick={reset} className={buttonCls}>
            Try again
          </button>
          <Link href="/" className={ghostButtonCls}>
            Go to the typing test
          </Link>
        </>
      }
    >
      We couldn&apos;t load this page. It&apos;s usually temporary.
    </StatusPage>
  );
}
