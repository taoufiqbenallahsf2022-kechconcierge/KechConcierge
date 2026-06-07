import { Router } from "express";
import {
  homeProducts,
  productsByType,
  productDetails,
} from "../controllers/product.controller";

const router = Router();

router.get("/home", homeProducts);
router.get("/details/:uniqueCode", productDetails);
router.get("/:type", productsByType);

export default router;