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

const configSchema = z
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

export const historyQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.iso.datetime().optional(),
});
