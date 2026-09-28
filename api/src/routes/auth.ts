import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { HttpError, parse } from "../lib/http";
import { DUMMY_HASH_PROMISE, hashPassword, verifyPassword } from "../lib/password";
import { SESSION_COOKIE, createSession, destroySession } from "../lib/session";
import { UserModel, publicUser } from "../models/User";
import { loginSchema, registerSchema } from "../schemas";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

authRouter.post("/register", authLimiter, async (req, res) => {
  const { email, username, password } = parse(registerSchema, req.body);
  const usernameLower = username.toLowerCase();

  const [emailTaken, nameTaken] = await Promise.all([
    UserModel.exists({ email, deletedAt: null }),
    UserModel.exists({ usernameLower, deletedAt: null }),
  ]);
  if (emailTaken || nameTaken) {
    const fields: Record<string, string> = {};
    if (emailTaken) fields.email = "An account with this email already exists";
    if (nameTaken) fields.username = "Username is taken";
    throw new HttpError(409, "Account already exists", { fields });
  }

  try {
    const user = await UserModel.create({
      email,
      username,
      usernameLower,
      passwordHash: await hashPassword(password),
    });
    await createSession(res, user._id);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    // Lost a race with a concurrent signup.
    if (isDuplicateKey(err)) throw new HttpError(409, "Email or username already taken");
    throw err;
  }
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { identifier, password } = parse(loginSchema, req.body);
  const lower = identifier.toLowerCase();
  const user = await UserModel.findOne({
    ...(lower.includes("@") ? { email: lower } : { usernameLower: lower }),
    deletedAt: null,
  }).select("+passwordHash");

  // Always run a hash comparison so response time doesn't reveal whether the account exists.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await DUMMY_HASH_PROMISE));
  if (!user || !ok) throw new HttpError(401, "Incorrect email/username or password");

  await createSession(res, user._id);
  res.json({ user: publicUser(user) });
});

authRouter.post("/logout", async (req, res) => {
  await destroySession(res, req.cookies?.[SESSION_COOKIE]);
  res.status(204).end();
});

// Signed out is a normal state for this endpoint: 200 with user: null, not a 401.
authRouter.get("/me", async (req, res) => {
  const user = req.userId ? await UserModel.findOne({ _id: req.userId, deletedAt: null }) : null;
  res.json({ user: user ? publicUser(user) : null });
});
