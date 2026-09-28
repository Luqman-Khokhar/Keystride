/** Canonical site origin. SITE_URL wins; on Vercel the production domain is provided automatically. */
export const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Keystride";

/** Server-side only: the Express API origin (the browser uses same-origin /api). */
export const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");

/** Server-side fetch to the API with a short timeout; returns null on any failure or non-2xx. */
export async function apiGet<T>(path: string, revalidate = 0): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Safe JSON-LD for a <script> tag (escapes "<" so content can't close the tag). */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });

/** Like apiGet, but tells "doesn't exist" (404) apart from "API unavailable" (throws). */
export async function apiGetOrNotFound<T>(path: string, revalidate = 60): Promise<T | null> {
  const res = await fetch(`${API_URL}/api${path}`, {
    next: { revalidate },
    signal: AbortSignal.timeout(4000),
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return (await res.json()) as T;
}
