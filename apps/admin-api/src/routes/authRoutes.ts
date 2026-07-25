import bcrypt from "bcrypt";
import { Router } from "express";
import { requireAdminAuth } from "../auth/middleware.js";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "../auth/session.js";
import { prisma } from "../lib/prisma.js";

export const router = Router();
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(ip: string | undefined, email: string) {
  return `${ip ?? "unknown"}:${email}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

router.post("/login", async (req, res, next) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const key = rateLimitKey(req.ip, email);
    if (isRateLimited(key)) {
      return res
        .status(429)
        .json({ message: "Too many login attempts. Try again later." });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    const valid =
      !!user?.isActive && (await bcrypt.compare(password, user.passwordHash));
    if (!valid || !user) {
      recordFailure(key);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    attempts.delete(key);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginDate: new Date() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });
    res.cookie(
      SESSION_COOKIE,
      createSessionToken(updatedUser),
      sessionCookieOptions(),
    );
    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.get("/session", requireAdminAuth, (req, res) => {
  res.json({ user: req.adminUser });
});

router.post("/logout", requireAdminAuth, (_req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    ...sessionCookieOptions(),
    maxAge: undefined,
  });
  res.status(204).end();
});
