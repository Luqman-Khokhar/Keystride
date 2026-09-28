/**
 * How many proxy hops to trust for X-Forwarded-For (client IP → rate limits).
 * Local dev: the Next.js dev server on loopback. Production on Vercel: "true" — Vercel's edge
 * overwrites any client-sent X-Forwarded-For, so the left-most entry is the real visitor.
 */
function trustProxy(raw: string | undefined): number | string {
  const v = raw?.trim();
  if (!v) return "loopback";
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
