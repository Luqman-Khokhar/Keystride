import { Schema, Types, model, type InferSchemaType } from "mongoose";

/** One row per player per competition: join time, attempt count and best verified score. */
const entrySchema = new Schema({
  competitionId: { type: Types.ObjectId, ref: "Competition", required: true },
  userId: { type: Types.ObjectId, ref: "User", required: true },
  joinedAt: { type: Date, default: Date.now },
  attempts: { type: Number, default: 0 },
  best: {
    type: new Schema(
      {
        wpm: Number,
        rawWpm: Number,
        accuracy: Number,
        consistency: Number,
        resultId: { type: Types.ObjectId, ref: "Result" },
        at: Date,
      },
      { _id: false },
    ),
    default: null,
  },
});

entrySchema.index({ competitionId: 1, userId: 1 }, { unique: true });
// Standings: best score first, earlier achievement wins ties.
entrySchema.index({ competitionId: 1, "best.wpm": -1, "best.at": 1 });
// "My competitions".
entrySchema.index({ userId: 1, joinedAt: -1 });

export type CompetitionEntry = InferSchemaType<typeof entrySchema>;
export const CompetitionEntryModel = model("CompetitionEntry", entrySchema);
