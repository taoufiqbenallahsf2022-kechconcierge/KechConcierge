import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  readCookie,
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
} from "./session.js";

declare global {
  namespace Express {
    interface Request {
      adminSession?: SessionPayload;
      adminUser?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = readCookie(req.headers.cookie, SESSION_COOKIE);
    const session = token ? verifySessionToken(token) : null;
    if (!session) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    if (!user?.isActive) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.adminSession = session;
    req.adminUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}
