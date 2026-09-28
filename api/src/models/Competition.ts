import { Schema, Types, model, type InferSchemaType } from "mongoose";

const competitionSchema = new Schema(
  {
    /** Short public code used in URLs: /c/<slug>. */
    slug: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    creatorId: { type: Types.ObjectId, ref: "User", required: true },
    config: {
      mode: { type: String, enum: ["time", "words"], required: true },
      amount: { type: Number, required: true },
      punctuation: { type: Boolean, required: true },
      numbers: { type: Boolean, required: true },
      language: { type: String, required: true },
    },
    /** The one word sequence every player types. Hidden until the competition starts. */
    words: { type: [String], required: true, select: false },
    visibility: { type: String, enum: ["public", "unlisted"], required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    maxPlayers: { type: Number, required: true },
    /** null = unlimited. */
    maxAttempts: { type: Number, default: null },
    playerCount: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

competitionSchema.index({ slug: 1 }, { unique: true });
// Public listings by status.
competitionSchema.index({ visibility: 1, deletedAt: 1, endsAt: -1 });
competitionSchema.index({ visibility: 1, deletedAt: 1, startsAt: 1 });
competitionSchema.index({ creatorId: 1, createdAt: -1 });

export type Competition = InferSchemaType<typeof competitionSchema>;
export const CompetitionModel = model("Competition", competitionSchema);

export type CompetitionStatus = "upcoming" | "live" | "ended";

export function statusOf(c: { startsAt: Date; endsAt: Date }, now = new Date()): CompetitionStatus {
  if (now < c.startsAt) return "upcoming";
  if (now < c.endsAt) return "live";
  return "ended";
}
