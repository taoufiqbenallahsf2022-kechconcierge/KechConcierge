import { Router } from "express";
import { Prisma } from "../../../../packages/database/generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { createCloudflareDirectUpload } from "../services/cloudflareImagesService.js";
import { HeroText, translateHeroText } from "../services/heroTranslationService.js";

export const router = Router();
const MAX_SLIDES = 5;
const translatedLocales = ["fr", "de", "it", "pt", "es"];
const text = (value: unknown, max = 1000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const ms = (value: unknown, fallback: number, min: number, max: number) => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback; };
function englishFrom(row: Record<string, any>): HeroText { const en = row.content?.en ?? row; return { eyebrow: text(en.eyebrow, 160), title: text(en.title, 300), description: text(en.description, 1200), buttonLabel: text(en.buttonLabel, 100), altText: text(en.altText, 300) }; }
function readStored(value: unknown) {
  const legacy = Array.isArray(value) ? value : null;
  const object = !legacy && value && typeof value === "object" ? value as Record<string, any> : {};
  const rows = legacy ?? (Array.isArray(object.slides) ? object.slides : []); const first = rows[0] ?? {};
  return { settings: { durationMs: ms(object.settings?.durationMs ?? first.durationMs, 7000, 1000, 60000), transitionMs: ms(object.settings?.transitionMs ?? first.transitionMs, 1000, 0, 10000) }, slides: rows.slice(0, MAX_SLIDES).map((row: any, index: number) => ({ id: text(row.id, 100) || `slide-${index}`, mediaType: row.mediaType === "VIDEO" ? "VIDEO" : "IMAGE", mediaUrl: text(row.mediaUrl, 3000), buttonUrl: text(row.buttonUrl, 1000), isActive: row.isActive !== false, order: index, content: row.content && typeof row.content === "object" ? row.content : { en: englishFrom(row) } })) };
}
router.get("/hero", async (_req, res, next) => { try { const config = await prisma.websiteConfiguration.findUnique({ where: { id: "primary" } }); res.json({ ...readStored(config?.heroSlides), updatedAt: config?.updatedAt ?? null }); } catch (error) { next(error); } });
router.post("/hero/translate", async (req, res, next) => {
  try {
    const en = englishFrom({ content: { en: req.body?.content } });
    if (!en.title || !en.description) throw Object.assign(new Error("Add the English title and description first"), { status: 400 });
    res.json({ content: { en, ...(await translateHeroText(en)) } });
  } catch (error) { next(error); }
});
router.put("/hero", async (req, res, next) => {
  try {
    if (!Array.isArray(req.body?.slides)) throw Object.assign(new Error("slides must be an array"), { status: 400 });
    if (req.body.slides.length > MAX_SLIDES) throw Object.assign(new Error(`A maximum of ${MAX_SLIDES} hero slides is allowed`), { status: 400 });
    const settings = { durationMs: ms(req.body?.settings?.durationMs, 7000, 1000, 60000), transitionMs: ms(req.body?.settings?.transitionMs, 1000, 0, 10000) };
    const slides = req.body.slides.map((raw: any, index: number) => {
      const mediaUrl = text(raw?.mediaUrl, 3000); if (!mediaUrl) throw Object.assign(new Error(`Slide ${index + 1} requires background media`), { status: 400 });
      const en = englishFrom(raw); if (!en.title) throw Object.assign(new Error(`Slide ${index + 1} requires an English title`), { status: 400 });
      const existing = raw.content && typeof raw.content === "object" ? raw.content : {};
      const translations = Object.fromEntries(translatedLocales.map((locale) => [locale, englishFrom({ content: { en: existing[locale] ?? {} } })]));
      return { id: text(raw.id, 100) || `slide-${Date.now()}-${index}`, mediaType: raw.mediaType === "VIDEO" ? "VIDEO" : "IMAGE", mediaUrl, buttonUrl: text(raw.buttonUrl, 1000), isActive: raw.isActive !== false, order: index, content: { en, ...translations } };
    });
    const stored = { settings, slides };
    const config = await prisma.websiteConfiguration.upsert({ where: { id: "primary" }, create: { id: "primary", heroSlides: stored as Prisma.InputJsonValue, updatedBy: req.adminUser!.id }, update: { heroSlides: stored as Prisma.InputJsonValue, updatedBy: req.adminUser!.id } });
    res.json({ ...readStored(config.heroSlides), updatedAt: config.updatedAt });
  } catch (error) { next(error); }
});
router.post("/media/direct-upload", async (req, res, next) => { try { const contentType = text(req.body?.contentType, 100); if (!contentType.startsWith("image/")) return res.status(400).json({ message: "Cloudflare Images accepts image files only. Use a hosted URL for video slides." }); res.status(201).json(await createCloudflareDirectUpload({ filename: text(req.body?.filename, 255) || "hero-image", contentType })); } catch (error) { next(error); } });
