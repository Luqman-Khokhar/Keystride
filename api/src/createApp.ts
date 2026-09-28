import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { config } from "./config";
import { connectDb } from "./db";
import { HttpError } from "./lib/http";
import { loadUser, requireJson } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { leaderboardRouter } from "./routes/leaderboard";
import { resultsRouter } from "./routes/results";
import { usersRouter } from "./routes/users";

export function createApp() {
  return configureApp(express());
}

/** Installs middleware and routes on an Express app. */
export function configureApp(app: Express) {
  app.disable("x-powered-by");
  // Requests arrive via the Next.js proxy (and Render's load balancer in production);
  // trust exactly those hops so req.ip is the visitor's IP for rate limiting.
  app.set("trust proxy", config.trustProxy);

  if (config.corsOrigin?.length) {
    app.use(cors({ origin: config.corsOrigin, credentials: true }));
  }
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(requireJson);

  // Also echoes the caller's own IP as the API sees it (confirms proxy settings after deploy).
  app.get("/api/health", async (req, res) => {
    const db = await connectDb().then(
      () => "connected",
      () => "unavailable",
    );
    res.status(db === "connected" ? 200 : 503).json({ ok: db === "connected", db, ip: req.ip });
  });

  // Serverless instances start cold: make sure the DB is connected before any route runs.
  app.use(async (_req, _res, next) => {
    try {
      await connectDb();
    } catch (err) {
      console.error("Database connection failed:", err);
      throw new HttpError(503, "Service temporarily unavailable. Please try again.");
    }
    next();
  });
  app.use(loadUser);
  app.use("/api/auth", authRouter);
  app.use("/api/results", resultsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/leaderboard", leaderboardRouter);

  app.use((_req, _res, next) => next(new HttpError(404, "Not found")));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
      return;
    }
    const type = (err as { type?: string })?.type;
    if (type === "entity.parse.failed") {
      res.status(400).json({ error: "Malformed JSON" });
      return;
    }
    if (type === "entity.too.large") {
      res.status(413).json({ error: "Request too large" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  });

  return app;
}
