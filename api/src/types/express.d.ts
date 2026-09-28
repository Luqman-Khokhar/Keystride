import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      /** Set by loadUser when the session cookie is valid. */
      userId?: Types.ObjectId;
    }
  }
}

export {};
