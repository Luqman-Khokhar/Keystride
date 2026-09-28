import { Schema, Types, model, type InferSchemaType } from "mongoose";

const sampleSchema = new Schema(
  { second: Number, wpm: Number, raw: Number, errors: Number },
  // "errors" mirrors the engine's SecondSample field; no document methods rely on it.
  { _id: false, suppressReservedKeysWarning: true },
);

const resultSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    wpm: { type: Number, required: true },
    rawWpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    consistency: { type: Number, required: true },
    chars: {
      correct: Number,
      incorrect: Number,
      extra: Number,
      missed: Number,
    },
    mode: { type: String, enum: ["time", "words"], required: true },
    amount: { type: Number, required: true },
    punctuation: { type: Boolean, required: true },
    numbers: { type: Boolean, required: true },
    language: { type: String, required: true },
    durationMs: { type: Number, required: true },
    samples: [sampleSchema],
    /** Failed plausibility checks: kept for review, excluded from PBs and leaderboards. */
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: null },
    isPb: { type: Boolean, default: false },
    /** Set for competition attempts — excluded from personal bests and global leaderboards. */
    competitionId: { type: Types.ObjectId, ref: "Competition", default: null },
    competitionSlug: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// History: a user's results, newest first.
resultSchema.index({ userId: 1, createdAt: -1 });
// Personal bests per test configuration.
resultSchema.index({ userId: 1, mode: 1, amount: 1, punctuation: 1, numbers: 1, language: 1, wpm: -1 });
// Leaderboards.
resultSchema.index(
  { mode: 1, amount: 1, language: 1, wpm: -1 },
  { partialFilterExpression: { flagged: false, deletedAt: null, punctuation: false, numbers: false } },
);

export type Result = InferSchemaType<typeof resultSchema>;
export const ResultModel = model("Result", resultSchema);
