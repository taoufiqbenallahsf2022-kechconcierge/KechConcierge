import bcrypt from "bcrypt";
import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { Prisma } from "../../../../packages/database/generated/prisma/client.js";
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

const BOOTSTRAP_ADMIN_EMAIL = "taoufiq.benallah.sf2022@gmail.com";

function validBootstrapToken(candidate: string, configured: string) {
  const candidateBuffer = Buffer.from(candidate);
  const configuredBuffer = Buffer.from(configured);
  return (
    candidateBuffer.length === configuredBuffer.length &&
    timingSafeEqual(candidateBuffer, configuredBuffer)
  );
}

router.post("/bootstrap", async (req, res, next) => {
  try {
    if (process.env.ENABLE_ADMIN_BOOTSTRAP !== "true")
      return res.status(404).json({ message: "Not found" });

    const configuredToken = process.env.BOOTSTRAP_ADMIN_TOKEN?.trim() ?? "";
    if (configuredToken.length < 32)
      return res.status(503).json({ message: "Admin bootstrap is not configured" });

    const authorization = req.get("authorization") ?? "";
    const candidateToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";
    const key = rateLimitKey(req.ip, "admin-bootstrap");
    if (isRateLimited(key))
      return res
        .status(429)
        .json({ message: "Too many bootstrap attempts. Try again later." });
    if (!candidateToken || !validBootstrapToken(candidateToken, configuredToken)) {
      recordFailure(key);
      return res.status(401).json({ message: "Invalid bootstrap credentials" });
    }

    const existing = await prisma.user.findUnique({
      where: { email: BOOTSTRAP_ADMIN_EMAIL },
      select: { id: true },
    });
    if (existing)
      return res
        .status(410)
        .json({ message: "Admin bootstrap has already been completed" });

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    if (password.length < 12)
      return res
        .status(400)
        .json({ message: "Password must contain at least 12 characters" });
    const firstName =
      typeof req.body?.firstName === "string" && req.body.firstName.trim()
        ? req.body.firstName.trim()
        : "Taoufiq";
    const lastName =
      typeof req.body?.lastName === "string" && req.body.lastName.trim()
        ? req.body.lastName.trim()
        : "Benallah";

    try {
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email: BOOTSTRAP_ADMIN_EMAIL,
          passwordHash: await bcrypt.hash(password, 12),
          role: "ADMIN",
          isActive: true,
          createdBy: "admin-bootstrap",
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });
      attempts.delete(key);
      res.cookie(
        SESSION_COOKIE,
        createSessionToken(user),
        sessionCookieOptions(),
      );
      return res.status(201).json({ user });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        return res
          .status(410)
          .json({ message: "Admin bootstrap has already been completed" });
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

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
