"use client";

import { useState, useSyncExternalStore } from "react";
import { buttonCls } from "./states";

/** For use on bg-alt panels, where the default button surface would disappear. */
const onPanelCls =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-sub-alt px-4 py-2 text-sm text-text transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main active:opacity-70";

const noopSubscribe = () => () => {};

interface ShareActionsProps {
  /** Site-relative path to share, e.g. "/r/abc". */
  path: string;
  title: string;
  text: string;
  copyLabel?: string;
  onPanel?: boolean;
}

/** "Copy link" + native share sheet (when the device has one). */
export function ShareActions({ path, title, text, copyLabel = "copy link", onPanel = false }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState<string | null>(null);
  const canShare = useSyncExternalStore(noopSubscribe, () => "share" in navigator, () => false);
  const cls = onPanel ? onPanelCls : buttonCls;

  const url = () => `${window.location.origin}${path}`;

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
    <div className={`flex flex-wrap items-center gap-2 ${onPanel ? "justify-start" : "justify-center"}`}>
      <button type="button" onClick={copy} className={cls}>
        {copied ? "✓ link copied" : copyLabel}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, text, url: url() }).catch(() => {})}
          className={cls}
        >
          share…
        </button>
      )}
      {manual && (
        <input
          readOnly
          value={manual}
          aria-label="Link to share"
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          className="w-full rounded-lg bg-bg-alt px-3 py-2 text-sm text-text outline-none focus-visible:outline-2 focus-visible:outline-main"
        />
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
