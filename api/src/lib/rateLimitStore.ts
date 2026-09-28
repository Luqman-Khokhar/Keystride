import type { ClientRateLimitInfo, Options, Store } from "express-rate-limit";
import mongoose from "mongoose";

const COLLECTION = "ratelimits";

interface Counter {
  _id: string;
  hits: number;
  resetAt: Date;
}

let indexReady: Promise<unknown> | null = null;

/**
 * express-rate-limit store backed by MongoDB, so limits hold across every
 * serverless instance. One atomic upsert per hit; a TTL index cleans up.
 */
export class MongoRateLimitStore implements Store {
  prefix: string;
  private windowMs = 60_000;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options) {
    this.windowMs = options.windowMs;
  }

  private get col() {
    return mongoose.connection.collection<Counter>(COLLECTION);
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    indexReady ??= this.col.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {
      indexReady = null;
    });

    const now = new Date();
    const doc = await this.col.findOneAndUpdate(
      { _id: this.prefix + key },
      [
        {
          $set: {
            expired: { $or: [{ $not: ["$resetAt"] }, { $lte: ["$resetAt", now] }] },
          },
        },
        {
          $set: {
            hits: { $cond: ["$expired", 1, { $add: ["$hits", 1] }] },
            resetAt: { $cond: ["$expired", new Date(now.getTime() + this.windowMs), "$resetAt"] },
          },
        },
        { $unset: "expired" },
      ],
      { upsert: true, returnDocument: "after" },
    );
    return { totalHits: doc?.hits ?? 1, resetTime: doc?.resetAt };
  }

  async decrement(key: string) {
    await this.col.updateOne({ _id: this.prefix + key, hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }

  async resetKey(key: string) {
    await this.col.deleteOne({ _id: this.prefix + key });
  }
}
