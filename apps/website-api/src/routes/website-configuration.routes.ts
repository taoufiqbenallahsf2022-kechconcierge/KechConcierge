import { Router } from "express";
import { prisma } from "../config/prisma";

const router = Router();

router.get("/hero", async (_req, res, next) => {
  try {
    const config = await prisma.websiteConfiguration.findUnique({ where: { id: "primary" } });
    const raw: any = config?.heroSlides;
    const legacy = Array.isArray(raw);
    const rows = legacy ? raw : Array.isArray(raw?.slides) ? raw.slides : [];
    const locale = String(_req.query.lang ?? "en").toLowerCase();
    const settings = legacy
      ? { durationMs: Number(rows[0]?.durationMs) || 7000, transitionMs: Number(rows[0]?.transitionMs) || 1000 }
      : { durationMs: Number(raw?.settings?.durationMs) || 7000, transitionMs: Number(raw?.settings?.transitionMs) || 1000 };
    const slides = rows.map((slide: any) => {
      if (!slide?.content) return slide;
      const content = slide.content[locale] ?? slide.content.en ?? {};
      return { ...slide, ...content, content: undefined };
    });
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ heroSlides: slides.filter((slide: any) => slide?.isActive !== false).slice(0, 5), settings });
  } catch (error) { next(error); }
});

export default router;
