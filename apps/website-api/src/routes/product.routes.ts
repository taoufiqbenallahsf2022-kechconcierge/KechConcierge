import { Router } from "express";
import {
  homeProducts,
  productsByType,
  productDetails,
  productSeoIndex,
} from "../controllers/product.controller";

const router = Router();

router.get("/home", homeProducts);
router.get("/details/:uniqueCode", productDetails);
router.get("/seo-index", productSeoIndex);
router.get("/:type", productsByType);

export default router;
