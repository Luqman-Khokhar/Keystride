import { Router } from "express";
import { z } from "zod";
import { HttpError, parse } from "../lib/http";
import { ResultModel } from "../models/Result";
import { UserModel } from "../models/User";
import { bestsPipeline, userTotals } from "./results";

export const usersRouter = Router();

const params = z.object({ username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,20}$/) });

usersRouter.get("/:username", async (req, res) => {
  const { username } = parse(params, req.params);
  const user = await UserModel.findOne({ usernameLower: username.toLowerCase(), deletedAt: null })
    .select("username createdAt")
    .lean();
  if (!user) throw new HttpError(404, "User not found");

  const [bests, totals] = await Promise.all([
    ResultModel.aggregate(bestsPipeline(user._id, true)),
    userTotals(user._id),
  ]);
  res.json({ username: user.username, createdAt: user.createdAt, bests, ...totals });
});
