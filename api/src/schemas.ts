import { z } from "zod";
import { TIME_OPTIONS, WORD_OPTIONS } from "@keystride/engine";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email")),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,20}$/, "3–20 characters: letters, numbers or _"),
  password: z.string().min(8, "At least 8 characters").max(128, "At most 128 characters"),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username").max(254),
  password: z.string().min(1, "Enter your password").max(128),
});

export const configSchema = z
  .object({
    mode: z.enum(["time", "words"]),
    amount: z.number().int(),
    punctuation: z.boolean(),
    numbers: z.boolean(),
    language: z.literal("english"),
  })
  .refine(
    (c) =>
      (c.mode === "time" ? (TIME_OPTIONS as readonly number[]) : (WORD_OPTIONS as readonly number[])).includes(
        c.amount,
      ),
    "Unsupported test length",
  );

export const submissionSchema = z.object({
  config: configSchema,
  words: z.array(z.string().min(1).max(40)).min(1).max(1000),
  typed: z.array(z.string().max(80)).max(1000),
  committed: z.number().int().min(0).max(1000),
  keystrokes: z
    .array(
      z.object({
        t: z.number().finite().min(0),
        key: z.string().min(1).max(2),
        correct: z.boolean().nullable(),
      }),
    )
    .min(1)
    .max(20000),
  // Words mode has no clock limit; 30 minutes covers the slowest 100-word test.
  durationMs: z.number().finite().min(1000, "Test too short").max(30 * 60 * 1000),
});

export const leaderboardQuery = z.object({
  mode: z.literal("time").default("time"),
  amount: z.coerce.number().pipe(z.union([z.literal(15), z.literal(60)])).default(15),
});

export const resultIdParams = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/, "Invalid result id") });

export const historyQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.iso.datetime().optional(),
});

export const DURATION_MINUTES = [15, 60, 360, 1440, 4320, 10080] as const;
export const ATTEMPT_CAPS = [1, 3, 5, 10] as const;

export const createCompetitionSchema = z.object({
  title: z.string().trim().min(3, "At least 3 characters").max(60, "At most 60 characters"),
  description: z.string().trim().max(280, "At most 280 characters").default(""),
  config: configSchema,
  visibility: z.enum(["public", "unlisted"]),
  /** Omit to start now. */
  startsAt: z.iso.datetime().optional(),
  durationMinutes: z
    .number()
    .int()
    .refine((m) => (DURATION_MINUTES as readonly number[]).includes(m), "Unsupported duration"),
  maxPlayers: z.number().int().min(2, "At least 2 players").max(100, "At most 100 players").default(50),
  maxAttempts: z
    .number()
    .int()
    .refine((n) => (ATTEMPT_CAPS as readonly number[]).includes(n), "Unsupported attempt limit")
    .nullable()
    .default(null),
});

export const competitionListQuery = z.object({
  status: z.enum(["live", "upcoming", "ended", "mine"]).default("live"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  /** Opaque cursor from the previous page. */
  cursor: z.string().max(100).optional(),
});

export const slugParams = z.object({ slug: z.string().regex(/^[A-Za-z0-9]{6,12}$/) });
