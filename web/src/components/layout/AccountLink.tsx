"use client";

import Link from "next/link";
import { useGetMeQuery } from "@/store/api";
import { UserIcon } from "@/components/ui/icons";

const navCls =
  "flex items-center gap-2 rounded-control px-2.5 py-2 text-sm text-sub transition-colors duration-150 hover:bg-surface hover:text-text focus-visible:text-text focus-visible:outline-2 focus-visible:outline-main active:bg-bg-alt";

export function AccountLink() {
  const { data: user, isLoading } = useGetMeQuery();

  // While the session loads, hold the space with the signed-out link, invisible —
  // no grey placeholder box in the header, no shift when it resolves.
  if (isLoading) {
    return (
      <span aria-hidden="true" className={`${navCls} invisible`}>
        <UserIcon className="size-4.5" />
        <span className="max-sm:sr-only">Sign in</span>
      </span>
    );
  }

  return (
    <Link href={user ? "/account" : "/login"} className={navCls}>
      <UserIcon className="size-4.5" />
      <span className="max-w-32 truncate max-sm:sr-only">{user ? user.username : "Sign in"}</span>
    </Link>
  );
}
