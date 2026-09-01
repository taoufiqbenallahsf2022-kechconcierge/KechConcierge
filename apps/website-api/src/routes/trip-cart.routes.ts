import { Router, type Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma";

const router = Router();

type Owner = { visitorId: string; individualId: string | null };

function owner(req: Request): Owner {
  const visitorId = req.header("x-visitor-id")?.trim();
  if (!visitorId || visitorId.length < 16 || visitorId.length > 100)
    throw Object.assign(new Error("A valid visitor ID is required"), { status: 400 });
  const authorization = req.headers.authorization;
  if (!authorization) return { visitorId, individualId: null };
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) throw Object.assign(new Error("Invalid access token"), { status: 401 });
  const secret = process.env.JWT_SECRET;
  if (!secret) throw Object.assign(new Error("Authentication is unavailable"), { status: 503 });
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & { individualId?: string; id?: string };
    const individualId = decoded.individualId ?? decoded.id ?? (typeof decoded.sub === "string" ? decoded.sub : null);
    if (!individualId) throw new Error();
    return { visitorId, individualId };
  } catch { throw Object.assign(new Error("Invalid or expired access token"), { status: 401 }); }
}

const db = prisma as any;
const include = { items: { orderBy: { createdDate: "asc" } } };

async function activeCart(identity: Owner, create = false) {
  if (identity.individualId) {
    let cart = await db.tripCart.findFirst({ where: { individualId: identity.individualId, status: "ACTIVE" }, include });
    const visitorCart = await db.tripCart.findFirst({ where: { visitorId: identity.visitorId, individualId: null, status: "ACTIVE" }, include });
    if (cart && visitorCart && cart.id !== visitorCart.id) {
      for (const item of visitorCart.items) await db.tripCartItem.upsert({ where: { tripCartId_productId: { tripCartId: cart.id, productId: item.productId } }, create: { ...item, id: undefined, tripCartId: cart.id }, update: {} });
      await db.tripCart.update({ where: { id: visitorCart.id }, data: { status: "ABANDONED" } });
      cart = await db.tripCart.findUnique({ where: { id: cart.id }, include });
    } else if (!cart && visitorCart) {
      cart = await db.tripCart.update({ where: { id: visitorCart.id }, data: { individualId: identity.individualId }, include });
    }
    if (!cart && create) cart = await db.tripCart.create({ data: { visitorId: identity.visitorId, individualId: identity.individualId }, include });
    return cart;
  }
  let cart = await db.tripCart.findFirst({ where: { visitorId: identity.visitorId, individualId: null, status: "ACTIVE" }, include });
  if (!cart && create) cart = await db.tripCart.create({ data: { visitorId: identity.visitorId }, include });
  return cart;
}

router.get("/", async (req, res) => {
  const identity = owner(req);
  const cart = await activeCart(identity);
  res.json({ cart });
});

router.patch("/", async (req, res) => {
  const cart = await activeCart(owner(req), true);
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : null;
  const updated = await db.tripCart.update({ where: { id: cart.id }, data: { email: email || null, updatedDate: new Date() }, include });
  res.json({ cart: updated });
});

router.post("/items", async (req, res) => {
  const identity = owner(req);
  const body = req.body as Record<string, unknown>;
  const required = ["productId", "productType", "productName", "category"] as const;
  for (const field of required) if (typeof body[field] !== "string" || !String(body[field]).trim()) return res.status(400).json({ message: `${field} is required.` });
  const startDate = typeof body.startDate === "string" ? new Date(body.startDate) : null;
  const endDate = typeof body.endDate === "string" ? new Date(body.endDate) : null;
  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return res.status(400).json({ message: "Valid start and end dates are required." });
  if (Array.isArray(body.plans) && body.plans.length > 0 && (typeof body.planId !== "string" || !body.planId)) return res.status(400).json({ message: "A plan is required for this product." });
  const cart = await activeCart(identity, true);
  await db.tripCartItem.upsert({
    where: { tripCartId_productId: { tripCartId: cart.id, productId: String(body.productId) } },
    create: { tripCartId: cart.id, productId: String(body.productId), productType: String(body.productType), productName: String(body.productName), category: String(body.category), image: typeof body.image === "string" ? body.image : null, plans: Array.isArray(body.plans) ? body.plans : [], planId: typeof body.planId === "string" && body.planId ? body.planId : null, planTitle: typeof body.planTitle === "string" && body.planTitle ? body.planTitle : null, startDate: typeof body.startDate === "string" ? new Date(body.startDate) : null, endDate: typeof body.endDate === "string" ? new Date(body.endDate) : null },
    update: { productName: String(body.productName), category: String(body.category), image: typeof body.image === "string" ? body.image : null, plans: Array.isArray(body.plans) ? body.plans : [], planId: typeof body.planId === "string" && body.planId ? body.planId : null, planTitle: typeof body.planTitle === "string" && body.planTitle ? body.planTitle : null, startDate: typeof body.startDate === "string" ? new Date(body.startDate) : null, endDate: typeof body.endDate === "string" ? new Date(body.endDate) : null },
  });
  await db.tripCart.update({ where: { id: cart.id }, data: { updatedDate: new Date() } });
  res.status(201).json({ cart: await db.tripCart.findUnique({ where: { id: cart.id }, include }) });
});

router.patch("/items/:id", async (req, res) => {
  const cart = await activeCart(owner(req));
  if (!cart || !cart.items.some((item: any) => item.id === req.params.id)) return res.status(404).json({ message: "Trip item not found." });
  const body = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.planId === "string" || body.planId === null) data.planId = body.planId || null;
  if (typeof body.planTitle === "string" || body.planTitle === null) data.planTitle = body.planTitle || null;
  for (const field of ["startDate", "endDate"] as const) if (typeof body[field] === "string" || body[field] === null) data[field] = body[field] ? new Date(body[field] as string) : null;
  await db.tripCartItem.update({ where: { id: req.params.id }, data });
  await db.tripCart.update({ where: { id: cart.id }, data: { updatedDate: new Date() } });
  res.json({ cart: await db.tripCart.findUnique({ where: { id: cart.id }, include }) });
});

router.delete("/items/:id", async (req, res) => {
  const cart = await activeCart(owner(req));
  if (!cart || !cart.items.some((item: any) => item.id === req.params.id)) return res.status(404).json({ message: "Trip item not found." });
  await db.tripCartItem.delete({ where: { id: req.params.id } });
  await db.tripCart.update({ where: { id: cart.id }, data: { updatedDate: new Date() } });
  res.json({ cart: await db.tripCart.findUnique({ where: { id: cart.id }, include }) });
});

router.post("/submit", async (req, res) => {
  const cart = await activeCart(owner(req));
  if (!cart || !cart.items.length) return res.status(400).json({ message: "Trip cart is empty." });
  const { contactRequestId, email } = req.body as { contactRequestId?: unknown; email?: unknown };
  if (typeof contactRequestId !== "string" || !contactRequestId) return res.status(400).json({ message: "Contact request ID is required." });
  const requestExists = await db.contactRequest.findUnique({ where: { id: contactRequestId }, select: { id: true } });
  if (!requestExists) return res.status(400).json({ message: "Contact request not found." });
  const submitted = await db.tripCart.update({ where: { id: cart.id }, data: { status: "SUBMITTED", contactRequestId, email: typeof email === "string" ? email.toLowerCase() : null, submittedAt: new Date() }, include });
  res.json({ cart: submitted });
});

export default router;
