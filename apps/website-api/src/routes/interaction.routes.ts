import { Router } from "express";
import { ingestInteractions } from "../services/interaction.service";
const router = Router();
const windows = new Map<string, { time: number; count: number }>();
router.post("/", async (req, res, next) => {
  try {
    const key = `${req.ip}:${req.header("x-visitor-id") || ""}`;
    const now = Date.now(), state = windows.get(key);
    if (state && now - state.time < 60000 && state.count >= 120) return res.status(429).json({ message: "Interaction rate exceeded" });
    if (!state || now - state.time >= 60000) windows.set(key, { time: now, count: 1 }); else state.count++;
    if (windows.size > 5000) for (const [id, window] of windows) if (now - window.time >= 60000) windows.delete(id);
    res.json(await ingestInteractions(req));
  } catch (error) { next(error); }
});
export default router;
