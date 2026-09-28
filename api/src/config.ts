/**
 * How many proxy hops to trust for X-Forwarded-For (client IP → rate limits).
 * Local dev: the Next.js dev server on loopback. Production on Vercel: "true" — Vercel's edge
 * overwrites any client-sent X-Forwarded-For, so the left-most entry is the real visitor.
 */
export function trustProxy(raw: string | undefined): boolean | number | string {
  const v = raw?.trim().toLowerCase();
  if (!v) return "loopback";
  if (v === "true") return true;
  if (v === "false") return false;
  // Hop count, or a list of trusted addresses/subnets ("loopback, 10.0.0.0/8").
  return /^\d+$/.test(v) ? Number(v) : v;
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI?.trim() || "",
  corsOrigin: process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE === "true",
  trustProxy: trustProxy(process.env.TRUST_PROXY),
  sessionDays: 30,
} as const;
