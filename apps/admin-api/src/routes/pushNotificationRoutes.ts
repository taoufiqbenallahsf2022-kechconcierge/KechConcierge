import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const router = Router();

router.get("/vapid-public-key", (_req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) {
    return res.status(503).json({ message: "Push notifications are not configured" });
  }
  res.json({ publicKey });
});

router.post("/subscriptions", async (req, res, next) => {
  try {
    const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint.trim() : "";
    const p256dh = typeof req.body?.keys?.p256dh === "string" ? req.body.keys.p256dh.trim() : "";
    const auth = typeof req.body?.keys?.auth === "string" ? req.body.keys.auth.trim() : "";
    if (!endpoint.startsWith("https://") || !p256dh || !auth) {
      return res.status(400).json({ message: "Invalid push subscription" });
    }

    const subscription = await prisma.adminPushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: req.adminUser!.id,
        endpoint,
        p256dh,
        auth,
        userAgent: req.get("user-agent")?.slice(0, 1000),
      },
      update: {
        userId: req.adminUser!.id,
        p256dh,
        auth,
        userAgent: req.get("user-agent")?.slice(0, 1000),
      },
      select: { id: true },
    });
    res.status(201).json({ subscription });
  } catch (error) {
    next(error);
  }
});

router.delete("/subscriptions", async (req, res, next) => {
  try {
    const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint.trim() : "";
    if (!endpoint) return res.status(400).json({ message: "Endpoint is required" });
    await prisma.adminPushSubscription.deleteMany({
      where: { endpoint, userId: req.adminUser!.id },
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
