import Link from "next/link";
import { primaryButtonCls } from "@/components/ui/states";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Page not found</h1>
      <p className="text-sub">The link may be wrong, or the page no longer exists.</p>
      <Link href="/" className={primaryButtonCls}>
        Take a typing test
      </Link>
    </main>
  );
}
