"use client";

import Link from "next/link";
import { useGetMeQuery } from "@/store/api";
import { Skeleton } from "@/components/ui/states";

const navCls =
  "flex items-center gap-2 rounded-lg p-2 text-sub transition-colors hover:text-text focus-visible:text-text focus-visible:outline-2 focus-visible:outline-main active:opacity-70";

export function AccountLink() {
  const { data: user, isLoading } = useGetMeQuery();

  if (isLoading) return <Skeleton className="h-9 w-24" />;

  return (
    <Link href={user ? "/account" : "/login"} className={navCls}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
      <span className="max-w-32 truncate text-sm max-sm:sr-only">{user ? user.username : "sign in"}</span>
    </Link>
  );
}
