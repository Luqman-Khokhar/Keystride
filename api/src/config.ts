export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI?.trim() || "",
  corsOrigin: process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE === "true",
  sessionDays: 30,
} as const;
