"use client";

import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";
import { useEffect, useRef, useState } from "react";
import { raceChannel, raceLiveChannel } from "@/lib/race";

/**
 * One Ably connection per race page, authenticated by the API with a token scoped to
 * this race. Connects on mount and closes just after unmount: the close is deferred so a
 * Strict Mode remount (children's effects re-run before ours) cancels it instead of
 * entering presence on a closed connection. Mount with key={slug}.
 */
export default function RaceRealtime({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new Ably.Realtime({
        authUrl: `/api/competitions/${encodeURIComponent(slug)}/realtime-token`,
        authMethod: "GET",
        autoConnect: false,
      }),
  );

  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(closeTimer.current);
    client.connect();
    return () => {
      closeTimer.current = window.setTimeout(() => client.close(), 0);
    };
  }, [client]);

  return (
    <AblyProvider client={client}>
      <ChannelProvider channelName={raceChannel(slug)}>
        <ChannelProvider channelName={raceLiveChannel(slug)}>{children}</ChannelProvider>
      </ChannelProvider>
    </AblyProvider>
  );
}
