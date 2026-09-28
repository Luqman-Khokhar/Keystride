"use client";

import { useState, useSyncExternalStore } from "react";
/** Sits on the bg-alt details panel, so it needs a contrasting surface. */
const panelButtonCls =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-sub-alt px-4 py-2 text-sm text-text transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main active:opacity-70";

const noopSubscribe = () => () => {};

export function ShareButton({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(noopSubscribe, () => "share" in navigator, () => false);
  const [manual, setManual] = useState<string | null>(null);

  const url = () => `${window.location.origin}/c/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions / insecure context): show the link to copy by hand.
      setManual(url());
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copy} className={panelButtonCls}>
        {copied ? "✓ link copied" : "copy invite link"}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, text: `Join my typing competition "${title}" on Keystride`, url: url() }).catch(() => {})}
          className={panelButtonCls}
        >
          share…
        </button>
      )}
      {manual && (
        <input
          readOnly
          value={manual}
          aria-label="Invite link"
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          className="w-full rounded-lg bg-bg-alt px-3 py-2 text-sm text-text outline-none focus-visible:outline-2 focus-visible:outline-main"
        />
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? "Invite link copied to clipboard" : ""}
      </span>
    </div>
  );
}
