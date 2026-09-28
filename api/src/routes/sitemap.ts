import { Router } from "express";
import { ResultModel } from "../models/Result";
import { UserModel } from "../models/User";

export const sitemapRouter = Router();

/** Public profiles worth indexing (users with verified results), for the web app's sitemap.xml. */
sitemapRouter.get("/", async (_req, res) => {
  const active = await ResultModel.aggregate<{ _id: unknown; last: Date }>([
    { $match: { deletedAt: null, flagged: false } },
    { $group: { _id: "$userId", last: { $max: "$createdAt" } } },
    { $sort: { last: -1 } },
    { $limit: 5000 },
  ]);
  const users = await UserModel.find({ _id: { $in: active.map((a) => a._id) }, deletedAt: null })
    .select("username")
    .lean();
  const lastById = new Map(active.map((a) => [String(a._id), a.last]));

  res.set("Cache-Control", "public, max-age=3600");
  res.json({
    users: users.map((u) => ({ username: u.username, lastModified: lastById.get(String(u._id)) })),
  });
});
