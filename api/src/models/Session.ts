import { Schema, Types, model } from "mongoose";

const sessionSchema = new Schema({
  /** sha256 of the cookie token — the raw token is never stored. */
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// MongoDB TTL monitor removes expired sessions automatically.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model("Session", sessionSchema);
