import mongoose from "mongoose";
import { config } from "./config";

let connecting: Promise<typeof mongoose> | null = null;

/**
 * Connects once per process and reuses it. On Vercel, warm function instances
 * keep the connection between requests; a failed attempt is retried next time.
 */
export function connectDb(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  if (!config.mongoUri) return Promise.reject(new Error("MONGODB_URI is not set"));
  connecting ??= mongoose
    .connect(config.mongoUri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 })
    .catch((err) => {
      connecting = null;
      throw err;
    });
  return connecting;
}
