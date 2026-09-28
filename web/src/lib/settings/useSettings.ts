"use client";

import { useSyncExternalStore } from "react";
import { settingsStore, type Settings } from "./settings";

export function useSettings(): Settings {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.getServer);
}
