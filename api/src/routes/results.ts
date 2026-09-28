import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { PipelineStage, Types } from "mongoose";
import { HttpError, parse, userId } from "../lib/http";
import { MongoRateLimitStore } from "../lib/rateLimitStore";
import { verifySubmission } from "../lib/verify";
import { requireAuth } from "../middleware/auth";
import { ResultModel } from "../models/Result";
import { historyQuery, submissionSchema } from "../schemas";

export const resultsRouter = Router();

/** Tests under this accuracy are considered invalid and not saved. */
const MIN_ACCURACY = 75;

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  store: new MongoRateLimitStore("submit:"),
  message: { error: "Too many results submitted. Slow down a little." },
});

export const RESULT_FIELDS =
  "wpm rawWpm accuracy consistency chars mode amount punctuation numbers language durationMs isPb flagged createdAt";

export function toDto(r: Record<string, unknown> & { _id: unknown }) {
  const { _id, ...rest } = r;
  return { id: String(_id), ...rest };
}

/** Best non-flagged result per test configuration. */
export function bestsPipeline(uid: Types.ObjectId, standardOnly = false): PipelineStage[] {
  return [
    {
      $match: {
        userId: uid,
        flagged: false,
        deletedAt: null,
        ...(standardOnly ? { punctuation: false, numbers: false } : {}),
      },
    },
    { $sort: { wpm: -1, createdAt: 1 } },
    {
      $group: {
        _id: { mode: "$mode", amount: "$amount", punctuation: "$punctuation", numbers: "$numbers", language: "$language" },
        wpm: { $first: "$wpm" },
        rawWpm: { $first: "$rawWpm" },
        accuracy: { $first: "$accuracy" },
        consistency: { $first: "$consistency" },
        createdAt: { $first: "$createdAt" },
      },
    },
    { $sort: { "_id.mode": 1, "_id.amount": 1 } },
    { $project: { _id: 0, config: "$_id", wpm: 1, rawWpm: 1, accuracy: 1, consistency: 1, createdAt: 1 } },
  ];
}

export async function userTotals(uid: Types.ObjectId) {
  const [t] = await ResultModel.aggregate<{ tests: number; timeMs: number }>([
    { $match: { userId: uid, deletedAt: null } },
    { $group: { _id: null, tests: { $sum: 1 }, timeMs: { $sum: "$durationMs" } } },
  ]);
  return { tests: t?.tests ?? 0, timeMs: t?.timeMs ?? 0 };
}

resultsRouter.post("/", requireAuth, submitLimiter, async (req, res) => {
  const sub = parse(submissionSchema, req.body);
  const verdict = verifySubmission(sub);
  if (!verdict.ok) throw new HttpError(422, `Result rejected: ${verdict.error}`);

  const { result, flagReason } = verdict;
  if (result.accuracy < MIN_ACCURACY) {
    throw new HttpError(422, `Accuracy under ${MIN_ACCURACY}% — result not saved`);
  }

  const uid = userId(req);
  const { mode, amount, punctuation, numbers, language } = result.config;
  let isPb = false;
  if (!flagReason) {
    const best = await ResultModel.findOne({
      userId: uid, mode, amount, punctuation, numbers, language, flagged: false, deletedAt: null,
    })
      .sort({ wpm: -1 })
      .select("wpm")
      .lean();
    isPb = !best || result.wpm > best.wpm;
  }

  const doc = await ResultModel.create({
    userId: uid,
    wpm: result.wpm,
    rawWpm: result.rawWpm,
    accuracy: result.accuracy,
    consistency: result.consistency,
    chars: result.chars,
    mode, amount, punctuation, numbers, language,
    durationMs: result.durationMs,
    samples: result.samples,
    flagged: !!flagReason,
    flagReason,
    isPb,
  });

  res.status(201).json({
    id: String(doc._id),
    wpm: result.wpm,
    accuracy: result.accuracy,
    isPb,
    counted: !flagReason,
    flagReason,
  });
});

resultsRouter.get("/me", requireAuth, async (req, res) => {
  const { limit, before } = parse(historyQuery, req.query);
  const items = await ResultModel.find({
    userId: userId(req),
    deletedAt: null,
    ...(before ? { createdAt: { $lt: new Date(before) } } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .select(RESULT_FIELDS)
    .lean();

  const hasMore = items.length > limit;
  const page = items.slice(0, limit);
  res.json({
    items: page.map(toDto),
    nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
  });
});

resultsRouter.get("/me/summary", requireAuth, async (req, res) => {
  const uid = userId(req);
  const [bests, totals] = await Promise.all([ResultModel.aggregate(bestsPipeline(uid)), userTotals(uid)]);
  res.json({ bests, ...totals });
});
