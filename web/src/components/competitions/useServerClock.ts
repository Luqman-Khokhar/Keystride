"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Current time corrected by the server's clock (from `serverNow` in API responses),
 * ticking every `intervalMs`. Keeps countdowns right even if the device clock is off.
 */
export function useServerClock(serverNow: string | undefined, intervalMs = 1000): number {
  const offset = useRef(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (serverNow) offset.current = Date.parse(serverNow) - Date.now();
  }, [serverNow]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now() + offset.current), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
