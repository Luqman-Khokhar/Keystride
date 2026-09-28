import { DEFAULT_CONFIG, TIME_OPTIONS, WORD_OPTIONS, type TestConfig } from "./types";

const STORAGE_KEY = "ks:config";

function isValid(c: Partial<TestConfig>): c is TestConfig {
  if (c.mode === "time") return (TIME_OPTIONS as readonly number[]).includes(c.amount ?? -1);
  if (c.mode === "words") return (WORD_OPTIONS as readonly number[]).includes(c.amount ?? -1);
  return false;
}

export function loadConfig(): TestConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as TestConfig;
    return isValid(parsed)
      ? {
          ...parsed,
          punctuation: !!parsed.punctuation,
          numbers: !!parsed.numbers,
          language: "english",
        }
      : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: TestConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Storage unavailable (private mode, blocked) — settings just won't persist.
  }
}
