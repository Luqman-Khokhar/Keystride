import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    username: { type: String, required: true, trim: true },
    /** Lowercased username for case-insensitive uniqueness and lookups. */
    usernameLower: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Unique among non-deleted accounts only, so soft-deleted names can be reused.
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
userSchema.index(
  { usernameLower: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;
export const UserModel = model("User", userSchema);

export function publicUser(u: Pick<UserDoc, "_id" | "username" | "email" | "createdAt">) {
  return {
    id: String(u._id),
    username: u.username,
    email: u.email,
    createdAt: u.createdAt,
  };
}
