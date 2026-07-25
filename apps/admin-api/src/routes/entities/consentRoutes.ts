import { Router } from "express";
import { service } from "../../services/entities/consentService.js";
export const router = Router();
router.get("/", async (req, res, next) => {
  try {
    res.json(await service.list(req.query as Record<string, string>));
  } catch (e) {
    next(e);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    res.json(await service.one(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (e) {
    next(e);
  }
});
router.patch("/:id", async (req, res, next) => {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
});
router.delete("/:id", async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
