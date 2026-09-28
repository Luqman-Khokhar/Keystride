import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { PipelineStage, Types } from "mongoose";
import type { TestConfig } from "@keystride/engine";
import { competitionWords, matchesCompetition, newSlug } from "../lib/competition";
import { HttpError, parse, userId } from "../lib/http";
import { MongoRateLimitStore } from "../lib/rateLimitStore";
import { verifySubmission } from "../lib/verify";
import { requireAuth } from "../middleware/auth";
import { CompetitionModel, statusOf, type Competition } from "../models/Competition";
import { CompetitionEntryModel } from "../models/CompetitionEntry";
import { ResultModel } from "../models/Result";
import { UserModel } from "../models/User";
import {
  competitionListQuery,
  createCompetitionSchema,
  slugParams,
  submissionSchema,
} from "../schemas";

export const competitionsRouter = Router();

const MIN_ACCURACY = 75;
const MAX_START_AHEAD_MS = 30 * 24 * 60 * 60 * 1000;
const validate = { trustProxy: false };

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  store: new MongoRateLimitStore("compcreate:"),
  validate,
  message: { error: "You've created a lot of competitions. Try again in an hour." },
});

const attemptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  store: new MongoRateLimitStore("compattempt:"),
  validate,
  message: { error: "Too many attempts submitted. Slow down a little." },
});

type CompDoc = Competition & { _id: Types.ObjectId };

async function findCompetition(slug: string, withWords = false): Promise<CompDoc> {
  const q = CompetitionModel.findOne({ slug, deletedAt: null });
  if (withWords) q.select("+words");
  const comp = (await q.lean()) as CompDoc | null;
  if (!comp) throw new HttpError(404, "Competition not found");
  return comp;
}

async function usernamesById(ids: Types.ObjectId[]) {
  const users = await UserModel.find({ _id: { $in: ids } }).select("username").lean();
  return new Map(users.map((u) => [String(u._id), u.username]));
}

function summary(c: CompDoc, creator: string | undefined, now: Date) {
  return {
    slug: c.slug,
    title: c.title,
    creator: creator ?? "[deleted]",
    config: c.config as TestConfig,
    visibility: c.visibility,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    playerCount: c.playerCount,
    maxPlayers: c.maxPlayers,
    maxAttempts: c.maxAttempts ?? null,
    status: statusOf(c, now),
  };
}

// ---- create ----------------------------------------------------------------

competitionsRouter.post("/", requireAuth, createLimiter, async (req, res) => {
  const input = parse(createCompetitionSchema, req.body);
  const uid = userId(req);
  const now = Date.now();

  const startsAt = input.startsAt ? new Date(input.startsAt) : new Date(now);
  if (startsAt.getTime() < now - 60_000) {
    throw new HttpError(400, "Invalid input", { fields: { startsAt: "Start time is in the past" } });
  }
  if (startsAt.getTime() > now + MAX_START_AHEAD_MS) {
    throw new HttpError(400, "Invalid input", { fields: { startsAt: "Start within the next 30 days" } });
  }
  const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000);
  const config = input.config as TestConfig;

  let comp: CompDoc | null = null;
  for (let tries = 0; !comp && tries < 5; tries++) {
    try {
      const doc = await CompetitionModel.create({
        slug: newSlug(),
        title: input.title,
        description: input.description,
        creatorId: uid,
        config,
        words: competitionWords(config),
        visibility: input.visibility,
        startsAt,
        endsAt,
        maxPlayers: input.maxPlayers,
        maxAttempts: input.maxAttempts,
        playerCount: 1,
      });
      comp = doc.toObject() as CompDoc;
    } catch (err) {
      // Slug collision: try another code.
      if ((err as { code?: number }).code !== 11000) throw err;
    }
  }
  if (!comp) throw new HttpError(500, "Couldn't create the competition. Please try again.");

  // The creator is always the first player.
  await CompetitionEntryModel.create({ competitionId: comp._id, userId: uid });
  res.status(201).json({ slug: comp.slug });
});

// ---- list --------------------------------------------------------------------

competitionsRouter.get("/", async (req, res) => {
  const { status, limit, cursor } = parse(competitionListQuery, req.query);
  const now = new Date();
  const offset = Math.min(Number(cursor) || 0, 10_000);

  let filter: Record<string, unknown>;
  let sort: Record<string, 1 | -1>;
  if (status === "mine") {
    const uid = userId(req);
    const joined = await CompetitionEntryModel.find({ userId: uid }).select("competitionId").lean();
    filter = { deletedAt: null, $or: [{ creatorId: uid }, { _id: { $in: joined.map((e) => e.competitionId) } }] };
    sort = { startsAt: -1, _id: -1 };
  } else {
    const base = { visibility: "public", deletedAt: null };
    if (status === "live") {
      filter = { ...base, startsAt: { $lte: now }, endsAt: { $gt: now } };
      sort = { endsAt: 1, _id: 1 };
    } else if (status === "upcoming") {
      filter = { ...base, startsAt: { $gt: now } };
      sort = { startsAt: 1, _id: 1 };
    } else {
      filter = { ...base, endsAt: { $lte: now } };
      sort = { endsAt: -1, _id: -1 };
    }
  }

  const docs = (await CompetitionModel.find(filter)
    .sort(sort)
    .skip(offset)
    .limit(limit + 1)
    .lean()) as CompDoc[];
  const page = docs.slice(0, limit);
  const names = await usernamesById(page.map((c) => c.creatorId as Types.ObjectId));

  res.json({
    items: page.map((c) => summary(c, names.get(String(c.creatorId)), now)),
    nextCursor: docs.length > limit ? String(offset + limit) : null,
  });
});

// ---- detail ------------------------------------------------------------------

competitionsRouter.get("/:slug", async (req, res) => {
  const { slug } = parse(slugParams, req.params);
  const comp = await findCompetition(slug, true);
  const now = new Date();
  const status = statusOf(comp, now);
  const [names, entry] = await Promise.all([
    usernamesById([comp.creatorId as Types.ObjectId]),
    req.userId ? CompetitionEntryModel.findOne({ competitionId: comp._id, userId: req.userId }).lean() : null,
  ]);

  res.json({
    ...summary(comp, names.get(String(comp.creatorId)), now),
    description: comp.description,
    serverNow: now,
    // The text stays secret until the start, so nobody can practise it.
    words: status === "upcoming" ? null : comp.words,
    me: req.userId
      ? {
          joined: !!entry,
          isCreator: String(comp.creatorId) === String(req.userId),
          attempts: entry?.attempts ?? 0,
          best: entry?.best ?? null,
        }
      : null,
  });
});

// ---- standings -----------------------------------------------------------------

competitionsRouter.get("/:slug/standings", async (req, res) => {
  const { slug } = parse(slugParams, req.params);
  const comp = await findCompetition(slug);
  const now = new Date();

  const pipeline: PipelineStage[] = [
    { $match: { competitionId: comp._id } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        pipeline: [{ $match: { deletedAt: null } }, { $project: { username: 1 } }],
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $addFields: { scored: { $cond: [{ $gt: ["$best.wpm", null] }, 1, 0] } } },
    { $sort: { scored: -1, "best.wpm": -1, "best.at": 1, joinedAt: 1 } },
    { $limit: 100 },
    { $project: { _id: 0, username: "$user.username", attempts: 1, joinedAt: 1, best: 1 } },
  ];
  const rows = await CompetitionEntryModel.aggregate(pipeline);

  let rank = 0;
  res.json({
    status: statusOf(comp, now),
    serverNow: now,
    playerCount: comp.playerCount,
    entries: rows.map((r) => ({
      rank: r.best ? ++rank : null,
      username: r.username,
      attempts: r.attempts,
      joinedAt: r.joinedAt,
      best: r.best
        ? { wpm: r.best.wpm, rawWpm: r.best.rawWpm, accuracy: r.best.accuracy, consistency: r.best.consistency, at: r.best.at }
        : null,
    })),
  });
});

// ---- join ------------------------------------------------------------------------

competitionsRouter.post("/:slug/join", requireAuth, async (req, res) => {
  const { slug } = parse(slugParams, req.params);
  const uid = userId(req);
  const comp = await findCompetition(slug);
  if (statusOf(comp) === "ended") throw new HttpError(409, "This competition has ended");

  if (await CompetitionEntryModel.exists({ competitionId: comp._id, userId: uid })) {
    res.json({ joined: true });
    return;
  }

  // Reserve a seat atomically so concurrent joins can't exceed maxPlayers.
  const seat = await CompetitionModel.findOneAndUpdate(
    { _id: comp._id, $expr: { $lt: ["$playerCount", "$maxPlayers"] } },
    { $inc: { playerCount: 1 } },
  );
  if (!seat) throw new HttpError(409, "This competition is full");

  try {
    await CompetitionEntryModel.create({ competitionId: comp._id, userId: uid });
  } catch (err) {
    // Joined twice at once: give the seat back.
    await CompetitionModel.updateOne({ _id: comp._id }, { $inc: { playerCount: -1 } });
    if ((err as { code?: number }).code !== 11000) throw err;
  }
  res.status(201).json({ joined: true });
});

// ---- attempts --------------------------------------------------------------------

competitionsRouter.post("/:slug/attempts", requireAuth, attemptLimiter, async (req, res) => {
  const { slug } = parse(slugParams, req.params);
  const sub = parse(submissionSchema, req.body);
  const uid = userId(req);
  const comp = await findCompetition(slug, true);
  const config = comp.config as TestConfig;
  const now = Date.now();

  const entry = await CompetitionEntryModel.findOne({ competitionId: comp._id, userId: uid });
  if (!entry) throw new HttpError(403, "Join the competition first");

  // The test must have started after the competition opened, and been submitted
  // soon after it closed (a test started just before the end may finish late).
  const testStartedAt = now - sub.durationMs;
  if (testStartedAt < comp.startsAt.getTime() - 5_000) {
    throw new HttpError(409, "This attempt started before the competition opened");
  }
  const graceMs = (config.mode === "time" ? config.amount * 1000 : 5 * 60_000) + 30_000;
  if (now > comp.endsAt.getTime() + graceMs) throw new HttpError(409, "This competition has ended");

  const mismatch = matchesCompetition(sub, { config, words: comp.words });
  if (mismatch) throw new HttpError(422, `Attempt rejected: ${mismatch}`);

  const verdict = verifySubmission(sub);
  if (!verdict.ok) throw new HttpError(422, `Attempt rejected: ${verdict.error}`);
  const { result, flagReason } = verdict;
  if (result.accuracy < MIN_ACCURACY) {
    throw new HttpError(422, `Accuracy under ${MIN_ACCURACY}% — attempt not counted`);
  }

  // Use up an attempt (atomically respecting the creator's cap).
  const capped = comp.maxAttempts ?? null;
  const counted = await CompetitionEntryModel.findOneAndUpdate(
    { _id: entry._id, ...(capped ? { attempts: { $lt: capped } } : {}) },
    { $inc: { attempts: 1 } },
    { new: true },
  );
  if (!counted) throw new HttpError(409, "You've used all your attempts");

  const { mode, amount, punctuation, numbers, language } = result.config;
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
    isPb: false,
    competitionId: comp._id,
    competitionSlug: comp.slug,
  });

  let improved = false;
  if (!flagReason) {
    const upd = await CompetitionEntryModel.updateOne(
      { _id: entry._id, $or: [{ best: null }, { "best.wpm": { $lt: result.wpm } }] },
      {
        $set: {
          best: {
            wpm: result.wpm,
            rawWpm: result.rawWpm,
            accuracy: result.accuracy,
            consistency: result.consistency,
            resultId: doc._id,
            at: doc.createdAt,
          },
        },
      },
    );
    improved = upd.modifiedCount === 1;
  }

  const fresh = await CompetitionEntryModel.findById(entry._id).lean();
  let rank: number | null = null;
  if (fresh?.best) {
    rank =
      (await CompetitionEntryModel.countDocuments({
        competitionId: comp._id,
        $or: [
          { "best.wpm": { $gt: fresh.best.wpm } },
          { "best.wpm": fresh.best.wpm, "best.at": { $lt: fresh.best.at } },
        ],
      })) + 1;
  }

  res.status(201).json({
    wpm: result.wpm,
    accuracy: result.accuracy,
    counted: !flagReason,
    flagReason,
    improved,
    attempts: counted.attempts,
    attemptsLeft: capped ? Math.max(0, capped - counted.attempts) : null,
    rank,
    best: fresh?.best?.wpm ?? null,
  });
});

// ---- delete ------------------------------------------------------------------------

competitionsRouter.delete("/:slug", requireAuth, async (req, res) => {
  const { slug } = parse(slugParams, req.params);
  const comp = await findCompetition(slug);
  if (String(comp.creatorId) !== String(userId(req))) {
    throw new HttpError(403, "Only the creator can delete this competition");
  }
  await CompetitionModel.updateOne({ _id: comp._id }, { $set: { deletedAt: new Date() } });
  res.status(204).end();
});
