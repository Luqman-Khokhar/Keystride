import { Router } from "express";
import type { PipelineStage } from "mongoose";
import { parse } from "../lib/http";
import { ResultModel } from "../models/Result";
import { leaderboardQuery } from "../schemas";

export const leaderboardRouter = Router();

const LIMIT = 50;

leaderboardRouter.get("/", async (req, res) => {
  const { mode, amount } = parse(leaderboardQuery, req.query);

  // Leaderboards: english, no punctuation/numbers, verified results only.
  const base: PipelineStage[] = [
    {
      $match: {
        mode, amount, language: "english",
        flagged: false, deletedAt: null, punctuation: false, numbers: false,
        competitionId: null,
      },
    },
    { $sort: { wpm: -1, createdAt: 1 } },
    {
      $group: {
        _id: "$userId",
        wpm: { $first: "$wpm" },
        rawWpm: { $first: "$rawWpm" },
        accuracy: { $first: "$accuracy" },
        consistency: { $first: "$consistency" },
        createdAt: { $first: "$createdAt" },
      },
    },
    // Hide soft-deleted accounts.
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        pipeline: [{ $match: { deletedAt: null } }, { $project: { username: 1 } }],
        as: "user",
      },
    },
    { $unwind: "$user" },
    // Ties share a rank (1, 2, 2, 4…).
    { $setWindowFields: { sortBy: { wpm: -1 }, output: { rank: { $rank: {} } } } },
  ];

  const [entries, mine] = await Promise.all([
    ResultModel.aggregate([
      ...base,
      { $sort: { rank: 1, createdAt: 1 } },
      { $limit: LIMIT },
      { $project: { _id: 0, rank: 1, username: "$user.username", wpm: 1, rawWpm: 1, accuracy: 1, consistency: 1, createdAt: 1 } },
    ]),
    req.userId
      ? ResultModel.aggregate<{ rank: number; wpm: number }>([
          ...base,
          { $match: { _id: req.userId } },
          { $project: { _id: 0, rank: 1, wpm: 1 } },
        ])
      : Promise.resolve([]),
  ]);

  const me = mine[0] ?? null;

  res.json({
    mode,
    amount,
    entries,
    me,
  });
});
