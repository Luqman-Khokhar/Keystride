import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE, findSessionUserId } from "../lib/session";
import { HttpError } from "../lib/http";
import { UserModel } from "../models/User";

/** Attaches req.userId when a valid session cookie belongs to a non-deleted user. */
export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  const id = await findSessionUserId(req.cookies?.[SESSION_COOKIE]);
  if (id && (await UserModel.exists({ _id: id, deletedAt: null }))) req.userId = id;
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.userId) throw new HttpError(401, "Sign in required");
  next();
}

/**
 * CSRF guard: state-changing requests must be JSON. Cross-site HTML forms can't
 * send application/json without a CORS preflight, which we don't grant.
 */
export function requireJson(req: Request, _res: Response, next: NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD" && !req.is("application/json")) {
    throw new HttpError(415, "Content-Type must be application/json");
  }
  next();
}
