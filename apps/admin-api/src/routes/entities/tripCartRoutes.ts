import { Router } from "express";
import { service } from "../../services/entities/tripCartService.js";

export const router = Router();
router.get("/", async (req, res, next) => { try { res.json(await service.list(req.query as Record<string, string>)); } catch (error) { next(error); } });
router.get("/:id", async (req, res, next) => { try { res.json(await service.one(req.params.id)); } catch (error) { next(error); } });
