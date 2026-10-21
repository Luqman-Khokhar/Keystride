import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { PipelineStage, Types } from "mongoose";
import type { TestConfig } from "@keystride/engine";
import {
  RACE_LOBBY_MS,
  RACE_REMATCH_WINDOW_MS,
  competitionWords,
  matchesCompetition,
  newSlug,
  raceWindow,
} from "../lib/competition";
import { HttpError, parse, userId } from "../lib/http";
import { MongoRateLimitStore } from "../lib/rateLimitStore";
import { publishRace, raceTokenRequest } from "../lib/realtime";
import { allWordsExact, verifySubmission } from "../lib/verify";
import { requireAuth } from "../middleware/auth";
import { CompetitionModel, statusOf, type Competition } from "../models/Competition";
import { CompetitionEntryModel } from "../models/CompetitionEntry";
import { ResultModel } from "../models/Result";
import { UserModel } from "../models/User";
import {
  competitionListQuery,
  createCompetitionSchema,
  createRaceSchema,
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
    kind: c.kind ?? "standard",
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

  const slug = await insertCompetition(uid, {
    title: input.title,
    description: input.description,
    config,
    words: competitionWords(config),
    visibility: input.visibility,
    startsAt,
    endsAt,
    maxPlayers: input.maxPlayers,
    maxAttempts: input.maxAttempts,
  });
  res.status(201).json({ slug });
});

competitionsRouter.post("/races", requireAuth, createLimiter, async (req, res) => {
  const input = parse(createRaceSchema, req.body);
  const uid = userId(req);
  const config: TestConfig = {
    mode: "words",
    amount: input.words,
    punctuation: input.punctuation,
    numbers: input.numbers,
    language: "english",
  };
  const slug = await insertRace(uid, input.title, config, input.maxPlayers, input.track, null);
  res.status(201).json({ slug });
});

/** A new race lobby. Lobby: startsAt = endsAt = expiry, so it stays "upcoming" until the host starts it. */
function insertRace(
  uid: Types.ObjectId,
  title: string,
  config: TestConfig,
  maxPlayers: number,
  track: string,
  rematchOf: string | null,
): Promise<string> {
  const expiresAt = new Date(Date.now() + RACE_LOBBY_MS);
  return insertCompetition(uid, {
    kind: "race",
    title,
    config,
    words: competitionWords(config),
    visibility: "unlisted",
    startsAt: expiresAt,
    endsAt: expiresAt,
    maxPlayers,
    maxAttempts: 1,
    race: { startedAt: null, rematchSlug: null, rematchOf, track },
  });
}

/** Creates a competition under a fresh slug, with its creator as the first player. */
async function insertCompetition(uid: Types.ObjectId, fields: Record<string, unknown>): Promise<string> {
  let comp: CompDoc | null = null;
  for (let tries = 0; !comp && tries < 5; tries++) {
    try {
      const doc = await CompetitionModel.create({ ...fields, slug: newSlug(), creatorId: uid, playerCount: 1 });
      comp = doc.toObject() as CompDoc;
    } catch (err) {
      // Slug collision: try another code.
      if ((err as { code?: number }).code !== 11000) throw err;
    }
  }
  if (!comp) throw new HttpError(500, "Couldn't create the competition. Please try again.");

  // The creator is always the first player.
  await CompetitionEntryModel.create({ competitionId: comp._id, userId: uid });
  return comp.slug;
}

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
    // A started race shows it during the countdown, like the start event does.
    words: status === "upcoming" && !comp.race?.startedAt ? null : comp.words,
    race:
      comp.kind === "race"
        ? {
            startedAt: comp.race?.startedAt ?? null,
            rematchSlug: comp.race?.rematchSlug ?? null,
            rematchOf: comp.race?.rematchOf ?? null,
            track: comp.race?.track ?? "laser",
          }
        : null,
    me: req.userId
      ? {
          joined: !!entry,
          isCreator: String(comp.creatorId) === String(req.userId),
          attempts: entry?.attempts ?? 0,
          best: entry?.best ?? null,
          race: entry?.race ?? null,
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
    ...(comp.kind === "race"
      ? // Races: verified finishers by finish time, then everyone else.
        [
          { $addFields: { scored: { $cond: [{ $gt: ["$race.finishMs", null] }, 1, 0] } } },
          { $sort: { scored: -1 as const, "race.finishMs": 1 as const, joinedAt: 1 as const } },
        ]
      : [
          { $addFields: { scored: { $cond: [{ $gt: ["$best.wpm", null] }, 1, 0] } } },
          { $sort: { scored: -1 as const, "best.wpm": -1 as const, "best.at": 1 as const, joinedAt: 1 as const } },
        ]),
    { $limit: 100 },
    { $project: { _id: 0, username: "$user.username", attempts: 1, joinedAt: 1, best: 1, scored: 1, finishMs: "$race.finishMs" } },
  ];
  const rows = await CompetitionEntryModel.aggregate(pipeline);

  let rank = 0;
  res.json({
    status: statusOf(comp, now),
    serverNow: now,
    playerCount: comp.playerCount,
    entries: rows.map((r) => ({
      rank: r.scored ? ++rank : null,
      username: r.username,
      attempts: r.attempts,
      joinedAt: r.joinedAt,
      best: r.best
        ? { wpm: r.best.wpm, rawWpm: r.best.rawWpm, accuracy: r.best.accuracy, consistency: r.best.consistency, at: r.best.at }
        : null,
      finishMs: r.finishMs ?? null,
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
  if (comp.race?.startedAt) throw new HttpError(409, "This race has already started");

  // Reserve a seat atomically so concurrent joins can't exceed maxPlayers
  // (or slip into a race that started meanwhile; non-races have no race.startedAt).
  const seat = await CompetitionModel.findOneAndUpdate(
    { _id: comp._id, "race.startedAt": null, $expr: { $lt: ["$playerCount", "$maxPlayers"] } },
    { $inc: { playerCount: 1 } },
  );
  if (!seat) {
    throw new HttpError(409, comp.kind === "race" && comp.playerCount < comp.maxPlayers
      ? "This race has already started"
      : "This competition is full");
  }

  try {
    await CompetitionEntryModel.create({ competitionId: comp._id, userId: uid });
  } catch (err) {
    // Joined twice at once: give the seat back.
    await CompetitionModel.updateOne({ _id: comp._id }, { $inc: { playerCount: -1 } });
    if ((err as { code?: number }).code !== 11000) throw err;
  }
  // Players still on the old race's results see who's in, to nudge the rest.
  if (comp.race?.rematchOf) await announceRematchPlayers(comp, uid);
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
  const isRace = comp.kind === "race";
  const testStartedAt = now - sub.durationMs;
  // Races unlock on a shared countdown, so allow only network jitter before the start.
  if (testStartedAt < comp.startsAt.getTime() - (isRace ? 1_000 : 5_000)) {
    throw new HttpError(409, "This attempt started before the competition opened");
  }
  const graceMs = isRace ? 30_000 : (config.mode === "time" ? config.amount * 1000 : 5 * 60_000) + 30_000;
  if (now > comp.endsAt.getTime() + graceMs) throw new HttpError(409, "This competition has ended");

  const mismatch = matchesCompetition(sub, { config, words: comp.words });
  if (mismatch) throw new HttpError(422, `Attempt rejected: ${mismatch}`);

  const verdict = verifySubmission(sub);
  if (!verdict.ok) throw new HttpError(422, `Attempt rejected: ${verdict.error}`);
  const { result, flagReason } = verdict;
  // Races make every word exact before moving on, so mistakes already cost time: no accuracy floor.
  if (isRace && !allWordsExact(sub)) {
    throw new HttpError(422, "Attempt rejected: every race word must be typed correctly");
  }
  if (!isRace && result.accuracy < MIN_ACCURACY) {
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

  let race: { finishMs: number; place: number } | null = null;
  if (isRace) race = await recordRaceFinish(comp, entry._id, uid, flagReason ? null : now, result);

  res.status(201).json({
    resultId: String(doc._id),
    wpm: result.wpm,
    accuracy: result.accuracy,
    counted: !flagReason,
    flagReason,
    improved,
    attempts: counted.attempts,
    attemptsLeft: capped ? Math.max(0, capped - counted.attempts) : null,
    rank: race ? race.place : rank,
    best: fresh?.best?.wpm ?? null,
    race,
  });
});

/**
 * Records a race attempt: a verified finish (`finishedAt` set) gets its time from the server
 * clock, so a late start costs time and device clocks don't matter. Once every player has
 * used their attempt the race ends right away instead of waiting for the cap.
 */
async function recordRaceFinish(
  comp: CompDoc,
  entryId: Types.ObjectId,
  uid: Types.ObjectId,
  finishedAt: number | null,
  result: { wpm: number; accuracy: number },
): Promise<{ finishMs: number; place: number } | null> {
  let race: { finishMs: number; place: number } | null = null;
  if (finishedAt !== null) {
    const finishMs = finishedAt - comp.startsAt.getTime();
    await CompetitionEntryModel.updateOne({ _id: entryId }, { $set: { race: { finishMs } } });
    // Standings sort by finishMs, so this place only feeds the live announcement.
    const place =
      (await CompetitionEntryModel.countDocuments({
        competitionId: comp._id,
        $or: [{ "race.finishMs": { $lt: finishMs } }, { "race.finishMs": finishMs, _id: { $lt: entryId } }],
      })) + 1;
    const user = await UserModel.findById(uid).select("username").lean();
    await publishRace(comp.slug, "finish", {
      username: user?.username ?? "[deleted]",
      place,
      wpm: result.wpm,
      accuracy: result.accuracy,
      finishMs,
    });
    race = { finishMs, place };
  }

  const pending = await CompetitionEntryModel.exists({ competitionId: comp._id, attempts: { $lt: 1 } });
  if (!pending) {
    const endsAt = new Date();
    const ended = await CompetitionModel.updateOne({ _id: comp._id, endsAt: { $gt: endsAt } }, { $set: { endsAt } });
    if (ended.modifiedCount) await publishRace(comp.slug, "end", { endsAt });
  }
  return race;
}

// ---- races ---------------------------------------------------------------------------

competitionsRouter.post("/:slug/start", requireAuth, async (req, res) => {
  const { slug } = parse(slugParams, req.params);
  const uid = userId(req);
  const comp = await findCompetition(slug, true);
  if (comp.kind !== "race") throw new HttpError(404, "Race not found");
  if (String(comp.creatorId) !== String(uid)) throw new HttpError(403, "Only the host can start the race");
  if (comp.race?.startedAt) throw new HttpError(409, "This race has already started");
  if (statusOf(comp) === "ended") throw new HttpError(409, "This lobby has expired. Create a new race.");
  if (comp.playerCount < 2) throw new HttpError(409, "Wait for at least one more player");

  const now = new Date();
  const { startsAt, endsAt } = raceWindow(now.getTime(), (comp.config as TestConfig).amount);
  // Atomic, so a double click can't restart the countdown.
  const started = await CompetitionModel.findOneAndUpdate(
    { _id: comp._id, "race.startedAt": null },
    { $set: { "race.startedAt": now, startsAt, endsAt } },
  );
  if (!started) throw new HttpError(409, "This race has already started");

  await publishRace(comp.slug, "start", { startsAt, endsAt, serverNow: now, words: comp.words });
  res.json({ startsAt, endsAt, serverNow: now });
});

/** Ably token request scoped to this race, for joined players only. */
competitionsRouter.get("/:slug/realtime-token", requireAuth, async (req, res) => {
  const { slug } = parse(slugParams, req.params);
  const uid = userId(req);
  const comp = await findCompetition(slug);
  if (comp.kind !== "race") throw new HttpError(404, "Race not found");
  // Finished races stay connected a while so their players can call a rematch.
  if (comp.endsAt.getTime() < Date.now() - RACE_REMATCH_WINDOW_MS) throw new HttpError(409, "This race is over");
  if (!(await CompetitionEntryModel.exists({ competitionId: comp._id, userId: uid }))) {
    throw new HttpError(403, "Join the race first");
  }
  res.json(await raceTokenRequest(comp.slug, String(uid)));
});

/**
 * Opens a rematch lobby (same settings, new text) hosted by whoever asks first; later
 * callers get the same lobby. Everyone still on the results hears about it.
 */
competitionsRouter.post("/:slug/rematch", requireAuth, createLimiter, async (req, res) => {
  const { slug } = parse(slugParams, req.params);
  const uid = userId(req);
  const comp = await findCompetition(slug);
  if (comp.kind !== "race") throw new HttpError(404, "Race not found");
  if (!comp.race?.startedAt || statusOf(comp) !== "ended") {
    throw new HttpError(409, "A rematch opens once the race is over");
  }
  if (!(await CompetitionEntryModel.exists({ competitionId: comp._id, userId: uid }))) {
    throw new HttpError(403, "Only racers can call a rematch");
  }
  if (comp.race.rematchSlug) {
    res.json({ slug: comp.race.rematchSlug });
    return;
  }

  const rematch = await insertRace(
    uid,
    comp.title,
    comp.config as TestConfig,
    comp.maxPlayers,
    comp.race.track ?? "laser",
    comp.slug,
  );
  const claimed = await CompetitionModel.findOneAndUpdate(
    { _id: comp._id, "race.rematchSlug": null },
    { $set: { "race.rematchSlug": rematch } },
  );
  if (!claimed) {
    // Someone else called it at the same moment: drop ours, send everyone to theirs.
    await CompetitionModel.updateOne({ slug: rematch }, { $set: { deletedAt: new Date() } });
    const winner = await findCompetition(slug);
    res.json({ slug: winner.race?.rematchSlug });
    return;
  }

  const user = await UserModel.findById(uid).select("username").lean();
  await publishRace(comp.slug, "rematch", { slug: rematch, by: user?.username ?? "[deleted]" });
  res.status(201).json({ slug: rematch });
});

/** Tells the original race's channel who has joined its rematch lobby so far. */
async function announceRematchPlayers(rematch: CompDoc, uid: Types.ObjectId) {
  const entries = await CompetitionEntryModel.find({ competitionId: rematch._id })
    .sort({ joinedAt: 1 })
    .select("userId")
    .lean();
  const names = await usernamesById(entries.map((e) => e.userId as Types.ObjectId));
  await publishRace(rematch.race!.rematchOf!, "rematch-join", {
    slug: rematch.slug,
    username: names.get(String(uid)) ?? "[deleted]",
    players: entries.map((e) => names.get(String(e.userId))).filter(Boolean),
    maxPlayers: rematch.maxPlayers,
  });
}

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
