import { Request, Response } from "express";
import {
  getHomeProducts,
  getProductsByType,
  getProductDetails,
} from "../services/product.service";

export async function homeProducts(req: Request, res: Response) {
  const lang = req.query.lang as string | undefined;
  const products = await getHomeProducts(lang);
  res.json(products);
}

export async function productsByType(req: Request, res: Response) {
  const type = req.params.type;
  const lang = req.query.lang as string | undefined;
  const page = Number(req.query.page || 1);

  const products = await getProductsByType(type as string, page, lang);
  res.json(products);
}

export async function productDetails(req: Request, res: Response) {
  const uniqueCode = req.params.uniqueCode;
  const lang = req.query.lang as string | undefined;

  //
  const product = await getProductDetails(uniqueCode as string, lang);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  res.json(product);
}