import { Router } from "express";
import { createCatalogDomainService } from "../services/catalogDomainService.js";

type Config = Parameters<typeof createCatalogDomainService>[0];

export function createCatalogDomainRouter(config: Config) {
  const router = Router();
  const service = createCatalogDomainService(config);
  router.get("/", async (req, res, next) => { try { res.json(await service.list(req.query as Record<string, string>)); } catch (error) { next(error); } });
  router.get("/:id", async (req, res, next) => { try { res.json(await service.one(req.params.id)); } catch (error) { next(error); } });
  router.post("/", async (req, res, next) => { try { res.status(201).json(await service.create(req.body)); } catch (error) { next(error); } });
  router.patch("/:id", async (req, res, next) => { try { res.json(await service.update(req.params.id, req.body)); } catch (error) { next(error); } });
  router.delete("/:id", async (req, res, next) => { try { await service.remove(req.params.id); res.status(204).end(); } catch (error) { next(error); } });
  if (config.planDelegate) {
    router.post("/:id/plans", async (req, res, next) => { try { res.status(201).json(await service.createPlan(req.params.id, req.body)); } catch (error) { next(error); } });
    router.patch("/plans/:planId", async (req, res, next) => { try { res.json(await service.updatePlan(req.params.planId, req.body)); } catch (error) { next(error); } });
    router.delete("/plans/:planId", async (req, res, next) => { try { await service.removePlan(req.params.planId); res.status(204).end(); } catch (error) { next(error); } });
    router.post("/plans/:planId/options", async (req, res, next) => { try { res.status(201).json(await service.createOption(req.params.planId, req.body)); } catch (error) { next(error); } });
    router.patch("/plan-options/:optionId", async (req, res, next) => { try { res.json(await service.updateOption(req.params.optionId, req.body)); } catch (error) { next(error); } });
    router.delete("/plan-options/:optionId", async (req, res, next) => { try { await service.removeOption(req.params.optionId); res.status(204).end(); } catch (error) { next(error); } });
  }
  return router;
}

export const villaRouter = createCatalogDomainRouter({ delegate: "villa" });
export const restaurantRouter = createCatalogDomainRouter({ delegate: "restaurant" });
export const beachClubRouter = createCatalogDomainRouter({ delegate: "beachClub", planDelegate: "beachClubPlan", optionDelegate: "beachClubPlanOption", parentForeignKey: "beachClubId", pricingUnits: ["PER_PERSON", "PER_ADULT", "PER_CHILD", "PER_SUNBED", "PER_TABLE", "PER_CABANA", "HALF_DAY", "FULL_DAY", "FIXED"] });
export const nightClubRouter = createCatalogDomainRouter({ delegate: "nightClub", planDelegate: "nightClubPlan", optionDelegate: "nightClubPlanOption", parentForeignKey: "nightClubId", pricingUnits: ["PER_PERSON", "PER_TABLE", "FIXED"] });
export const packRouter = createCatalogDomainRouter({ delegate: "pack", planDelegate: "packPlan", optionDelegate: "packPlanOption", parentForeignKey: "packId", pricingUnits: ["PER_PERSON", "PER_GROUP", "PER_VEHICLE", "PER_HOUR", "HALF_DAY", "FULL_DAY", "FIXED"] });
export const activityRouter = createCatalogDomainRouter({ delegate: "activity", planDelegate: "activityPlan", optionDelegate: "activityPlanOption", parentForeignKey: "activityId", pricingUnits: ["PER_PERSON", "PER_ADULT", "PER_CHILD", "PER_GROUP", "HALF_DAY", "FULL_DAY", "FIXED"] });
export const transportationRouter = createCatalogDomainRouter({ delegate: "transportation", planDelegate: "transportationPlan", optionDelegate: "transportationPlanOption", parentForeignKey: "transportationId", pricingUnits: ["PER_VEHICLE", "PER_PERSON", "PER_HOUR", "PER_TRIP", "HALF_DAY", "FULL_DAY", "FIXED"] });
