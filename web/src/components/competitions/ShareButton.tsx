"use client";

import { ShareActions } from "@/components/ui/ShareActions";

export function ShareButton({ slug, title }: { slug: string; title: string }) {
  return (
    <ShareActions
      path={`/c/${slug}`}
      title={title}
      text={`Join my typing competition "${title}" on Keystride`}
      copyLabel="copy invite link"
      onPanel
    />
  );
}
