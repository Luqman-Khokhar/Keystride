import { createHash, randomBytes } from "node:crypto";
import type { Response } from "express";
import type { Types } from "mongoose";
import { config } from "../config";
import { SessionModel } from "../models/Session";

export const SESSION_COOKIE = "ks_session";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(res: Response, userId: Types.ObjectId) {
  const token = randomBytes(32).toString("base64url");
  const maxAge = config.sessionDays * 24 * 60 * 60 * 1000;
  await SessionModel.create({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + maxAge),
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function findSessionUserId(token: string | undefined) {
  if (!token || token.length > 100) return null;
  const session = await SessionModel.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  }).lean();
  return session?.userId ?? null;
}

export async function destroySession(res: Response, token: string | undefined) {
  if (token) await SessionModel.deleteOne({ tokenHash: hashToken(token) });
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
