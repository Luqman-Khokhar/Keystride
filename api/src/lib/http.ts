import type { Request } from "express";
import type { z } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Parses req.body/query with a zod schema, throwing a 400 with field errors on failure. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    throw new HttpError(400, "Invalid input", { fields });
  }
  return result.data;
}

export const userId = (req: Request) => {
  if (!req.userId) throw new HttpError(401, "Sign in required");
  return req.userId;
};
