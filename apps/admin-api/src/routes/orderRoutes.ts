import { Router } from "express";
import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import {
  assertSessionMatchesPayment,
  canReuseCheckoutSession,
  createCheckoutSession,
  getStripeClient,
  getStripeWebhookSecret,
  isStripePaymentAvailable,
  paymentIdFromSession,
  paymentIntentId,
  transitionForCheckoutEvent,
  verifyStripeWebhook,
} from "../payments/stripePayments.js";

function fail(message: string, status = 400): never { throw Object.assign(new Error(message), { status }); }
const money = (value: unknown, field: string) => { const n = Number(value); if (!Number.isFinite(n) || n < 0) fail(`${field} must be a positive amount`); return n.toFixed(2); };
const email = (value: unknown) => String(value ?? "").trim().toLowerCase();
const phone = (value: unknown) => String(value ?? "").replace(/[^+\d]/g, "").trim() || null;
const token = () => randomBytes(32).toString("base64url");
const orderNumber = () => `MC-${new Date().toISOString().slice(0,10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
const escapeHtml = (value: unknown) => String(value ?? "").replace(
  /[&<>"']/g,
  (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!,
);

async function findOrCreateIndividual(data: any, adminId: string) {
  const normalizedEmail = email(data.clientEmail);
  const normalizedPhone = phone(data.clientPhone);
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) fail("A valid client email is required");
  const matches = await prisma.individual.findMany({ where: { OR: [
    { email: { equals: normalizedEmail, mode: "insensitive" } },
    { manualEmail: { equals: normalizedEmail, mode: "insensitive" } },
    ...(normalizedPhone ? [{ mobilePhone: normalizedPhone }] : []),
  ] } });
  const byEmail = matches.find((x) => x.email?.toLowerCase() === normalizedEmail || x.manualEmail?.toLowerCase() === normalizedEmail);
  const byPhone = normalizedPhone ? matches.find((x) => phone(x.mobilePhone) === normalizedPhone) : undefined;
  if (byEmail && byPhone && byEmail.id !== byPhone.id) fail("Email and phone belong to different Individuals. Resolve the records before creating this order", 409);
  if (byEmail || byPhone) return (byEmail || byPhone)!;
  return prisma.individual.create({ data: {
    id: `00IA${randomBytes(7).toString("hex").toUpperCase()}`,
    firstName: String(data.clientFirstName ?? "").trim(), lastName: String(data.clientLastName ?? "").trim(),
    email: null, manualEmail: normalizedEmail, mobilePhone: normalizedPhone,
    language: String(data.clientLanguage || "en").toLowerCase(), source: "ADMIN", isActive: false, emailVerified: false,
    createdBy: adminId, updatedBy: adminId,
  } });
}

async function totalsFor(db: any, orderId: string) {
  const items = await db.conciergeOrderItem.findMany({ where: { orderId } });
  const payments = await db.conciergeOrderPayment.findMany({
    where: { orderId, status: "PAID" },
  });
  const pendingCount = await db.conciergeOrderPayment.count({
    where: { orderId, status: "PENDING" },
  });
  const total = items.reduce((s: number, x: any) => s + Number(x.totalPrice), 0);
  const paid = payments.reduce((s: number, x: any) => s + Number(x.amount), 0);
  const paymentStatus = paid >= total && total > 0 ? "FULLY_PAID" : paid > 0 ? "PARTIALLY_PAID" : pendingCount ? "PAYMENT_REQUESTED" : "UNPAID";
  return db.conciergeOrder.update({ where: { id: orderId }, data: { totalAmount: total.toFixed(2), paidAmount: paid.toFixed(2), remainingAmount: Math.max(0, total-paid).toFixed(2), paymentStatus }, include: { items: true, payments: { orderBy: { createdDate: "desc" } }, individual: true, contactRequest: true } });
}

async function totals(orderId: string) {
  return totalsFor(prisma, orderId);
}

async function sendPaymentEmail(order: any, payment: any) {
  const key = process.env.RESEND_API_KEY;
  if (!key) fail("RESEND_API_KEY is not configured", 503);
  const site = process.env.PUBLIC_WEBSITE_URL || "https://moorishconcierge.com";
  const url = `${site}/pay/${payment.publicToken}`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({
    from: process.env.PAYMENT_EMAIL_FROM || "Moorish Concierge <contact@moorishconcierge.com>", to: [order.clientEmail],
    subject: `Payment request for order ${order.orderNumber}`,
    html: `<h2>Your Moorish Concierge order</h2><p>Hello ${escapeHtml(order.clientFirstName)},</p><p>We have confirmed your order. The amount requested now is <strong>${escapeHtml(payment.amount)} ${escapeHtml(payment.currency)}</strong>.</p><p><a href="${escapeHtml(url)}">Pay securely</a></p><p>Order total: ${escapeHtml(order.totalAmount)} ${escapeHtml(order.currency)}</p>`,
  }) });
  if (!response.ok) { const detail=await response.text(); fail(`Unable to send the payment email${detail?`: ${detail}`:""}`, 502); }
}

async function createOrReusePaymentRequest(
  orderId: string,
  amount: number,
  adminId: string,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const order = await tx.conciergeOrder.findUnique({
            where: { id: orderId },
          });
          if (!order) fail("Order not found", 404);

          const amountText = amount.toFixed(2);
          const unsentPayment = await tx.conciergeOrderPayment.findFirst({
            where: {
              orderId: order.id,
              amount: amountText,
              method: "STRIPE",
              status: "PENDING",
              emailSentAt: null,
            },
            orderBy: { createdDate: "desc" },
          });

          if (unsentPayment) {
            await tx.conciergeOrder.update({
              where: { id: order.id },
              data: {
                status: "CONFIRMED",
                paymentStatus: "PAYMENT_REQUESTED",
                updatedBy: adminId,
              },
            });
            return { order, payment: unsentPayment };
          }

          const pendingPayments = await tx.conciergeOrderPayment.findMany({
            where: { orderId: order.id, status: "PENDING" },
            select: { amount: true },
          });
          const pendingTotal = pendingPayments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0,
          );
          const availableToRequest = Math.max(
            0,
            Number(order.remainingAmount) - pendingTotal,
          );

          if (amount <= 0 || amount > availableToRequest) {
            fail(
              `Advance amount must be greater than zero and no more than the unrequested balance (${availableToRequest.toFixed(2)} ${order.currency})`,
            );
          }

          const payment = await tx.conciergeOrderPayment.create({
            data: {
              orderId: order.id,
              amount: amountText,
              currency: order.currency,
              method: "STRIPE",
              status: "PENDING",
              publicToken: token(),
              recordedBy: adminId,
            },
          });

          await tx.conciergeOrder.update({
            where: { id: order.id },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAYMENT_REQUESTED",
              updatedBy: adminId,
            },
          });

          return { order, payment };
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      lastError = error;
      if ((error as { code?: string })?.code !== "P2034" || attempt === 2) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function findPaymentForStripeSession(session: Stripe.Checkout.Session) {
  const paymentId = paymentIdFromSession(session);
  if (!paymentId) return null;

  const payment = await prisma.conciergeOrderPayment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) return null;

  assertSessionMatchesPayment(session, {
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount.toString(),
    currency: payment.currency,
  });
  return payment;
}

async function applyStripeSessionState(
  session: Stripe.Checkout.Session,
  state: "paid" | "failed" | "expired",
) {
  const payment = await findPaymentForStripeSession(session);
  if (!payment) return null;

  return prisma.$transaction(async (tx) => {
    const current = await tx.conciergeOrderPayment.findUnique({
      where: { id: payment.id },
    });
    if (!current) return null;

    if (state !== "paid" && current.stripeCheckoutSessionId !== session.id) {
      return null;
    }

    if (state === "paid") {
      if (session.payment_status !== "paid") return null;
      if (current.status !== "REFUNDED" && current.status !== "PAID") {
        await tx.conciergeOrderPayment.update({
          where: { id: current.id },
          data: {
            method: "STRIPE",
            status: "PAID",
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId(session),
            checkoutUrl: null,
            checkoutExpiresAt: null,
            paidAt: new Date(),
          },
        });
      }
      return totalsFor(tx, current.orderId);
    }

    if (current.status !== "PAID" && current.status !== "REFUNDED") {
      await tx.conciergeOrderPayment.update({
        where: { id: current.id },
        data: {
          status: state === "expired" ? "CANCELLED" : "FAILED",
          checkoutUrl: null,
          checkoutExpiresAt: null,
        },
      });
    }
    return totalsFor(tx, current.orderId);
  });
}

async function processStripeEvent(event: Stripe.Event) {
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const intentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (!charge.refunded || !intentId) return;

    await prisma.$transaction(async (tx) => {
      const payment = await tx.conciergeOrderPayment.findUnique({
        where: { stripePaymentIntentId: intentId },
      });
      if (!payment) return;

      if (payment.status !== "REFUNDED") {
        await tx.conciergeOrderPayment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });
      }
      await totalsFor(tx, payment.orderId);
    });
    return;
  }

  const transition = transitionForCheckoutEvent(event);
  if (transition.kind === "none") return;
  await applyStripeSessionState(
    event.data.object as Stripe.Checkout.Session,
    transition.kind,
  );
}

export const publicOrderRouter = Router();

publicOrderRouter.use("/payments/:token", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

publicOrderRouter.post("/stripe/webhook", async (req, res, next) => {
  try {
    const signature = req.header("stripe-signature");
    if (!signature) fail("Missing Stripe webhook signature", 400);
    if (!Buffer.isBuffer(req.body)) fail("Stripe webhook body must be raw", 400);

    const webhookSecret = getStripeWebhookSecret();
    const stripe = getStripeClient();

    let event: Stripe.Event;
    try {
      event = verifyStripeWebhook(
        req.body,
        signature,
        webhookSecret,
        stripe,
      );
    } catch {
      fail("Invalid Stripe webhook signature", 400);
    }

    await processStripeEvent(event);
    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
});

publicOrderRouter.get("/payments/:token", async (req, res, next) => {
  try {
    const payment = await prisma.conciergeOrderPayment.findUnique({
      where: { publicToken: req.params.token },
      include: { order: { include: { items: true } } },
    });
    if (!payment) return res.status(404).json({ message: "Payment request not found" });

    res.json({
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentAvailable: isStripePaymentAvailable(),
      order: {
        orderNumber: payment.order.orderNumber,
        clientFirstName: payment.order.clientFirstName,
        totalAmount: payment.order.totalAmount,
        items: payment.order.items,
      },
    });
  } catch (error) {
    next(error);
  }
});

publicOrderRouter.post("/payments/:token/stripe", async (req, res, next) => {
  try {
    if (!isStripePaymentAvailable()) {
      fail("Online payment is temporarily unavailable", 503);
    }
    const payment = await prisma.conciergeOrderPayment.findUnique({
      where: { publicToken: req.params.token },
      include: { order: true },
    });
    if (!payment || !payment.publicToken) fail("Payment request is unavailable", 404);
    if (payment.status === "PAID") fail("This payment has already been completed", 409);
    if (payment.status === "REFUNDED") fail("This payment has been refunded", 409);

    if (
      canReuseCheckoutSession(
        payment.checkoutUrl,
        payment.checkoutExpiresAt,
      )
    ) {
      return res.json({ url: payment.checkoutUrl });
    }

    const websiteUrl = process.env.PUBLIC_WEBSITE_URL || "http://localhost:3000";
    const idempotencyKey = `checkout-${payment.id}-${payment.stripeCheckoutSessionId || "initial"}`;
    const session = await createCheckoutSession(
      getStripeClient(),
      {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount.toString(),
        currency: payment.currency,
        publicToken: payment.publicToken,
        clientEmail: payment.order.clientEmail,
        orderNumber: payment.order.orderNumber,
      },
      websiteUrl,
      idempotencyKey,
    );

    if (!session.url) fail("Stripe did not return a Checkout URL", 502);

    await prisma.conciergeOrderPayment.update({
      where: { id: payment.id },
      data: {
        method: "STRIPE",
        status: "PENDING",
        stripeCheckoutSessionId: session.id,
        checkoutUrl: session.url,
        checkoutExpiresAt: new Date(session.expires_at * 1000),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

publicOrderRouter.post("/payments/:token/stripe/verify", async (req, res, next) => {
  try {
    const sessionId = String(req.body?.sessionId || "").trim();
    if (!sessionId) fail("Stripe Checkout Session ID is required");

    const payment = await prisma.conciergeOrderPayment.findUnique({
      where: { publicToken: req.params.token },
    });
    if (!payment) fail("Payment request not found", 404);
    if (payment.status === "PAID") return res.json(await totals(payment.orderId));
    if (payment.stripeCheckoutSessionId !== sessionId) {
      fail("Stripe Checkout Session does not match this payment request", 400);
    }

    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    const result = await applyStripeSessionState(session, "paid");
    if (!result) fail("Stripe has not confirmed this payment yet", 409);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export const orderRouter = Router();
orderRouter.get("/",async(req,res,next)=>{try{const items=await prisma.conciergeOrder.findMany({orderBy:{createdDate:"desc"},include:{_count:{select:{items:true,payments:true}}}});res.json({items,total:items.length,page:1,pageSize:items.length,pages:1});}catch(e){next(e);}});
orderRouter.get("/resolve-individual",async(req,res,next)=>{try{const normalizedEmail=email(req.query.email);if(!normalizedEmail)return res.json({individualId:null});const individual=await prisma.individual.findFirst({where:{OR:[{email:{equals:normalizedEmail,mode:"insensitive"}},{manualEmail:{equals:normalizedEmail,mode:"insensitive"}}]},select:{id:true}});res.json({individualId:individual?.id||null});}catch(e){next(e);}});
orderRouter.get("/:id",async(req,res,next)=>{try{const row=await prisma.conciergeOrder.findUnique({where:{id:req.params.id},include:{items:true,payments:{orderBy:{createdDate:"desc"}},individual:true,contactRequest:true}});if(!row)return res.status(404).json({message:"Order not found"});res.json(row);}catch(e){next(e);}});
orderRouter.patch("/:id",async(req,res,next)=>{try{const existing=await prisma.conciergeOrder.findUnique({where:{id:req.params.id}});if(!existing)fail("Order not found",404);const profile={...existing,...req.body};const individual=await findOrCreateIndividual(profile,req.adminUser!.id);await prisma.conciergeOrder.update({where:{id:existing.id},data:{individualId:individual.id,contactRequestId:req.body.contactRequestId===undefined?existing.contactRequestId:req.body.contactRequestId||null,clientFirstName:String(profile.clientFirstName).trim(),clientLastName:String(profile.clientLastName).trim(),clientEmail:email(profile.clientEmail),clientPhone:phone(profile.clientPhone),clientLanguage:String(profile.clientLanguage||"en"),notes:req.body.notes===undefined?existing.notes:req.body.notes||null,status:req.body.status||existing.status,updatedBy:req.adminUser!.id}});res.json(await totals(existing.id));}catch(e){next(e);}});
orderRouter.post("/:id/items",async(req,res,next)=>{try{const order=await prisma.conciergeOrder.findUnique({where:{id:req.params.id}});if(!order)fail("Order not found",404);const unit=Number(money(req.body.unitPrice,"Price"));await prisma.conciergeOrderItem.create({data:{orderId:order.id,productType:String(req.body.productType),productId:req.body.productId||null,productName:String(req.body.productName),planId:req.body.planId||null,planName:req.body.planName||null,optionId:req.body.optionId||null,optionName:req.body.optionName||null,startDate:req.body.startDate?new Date(req.body.startDate):null,endDate:req.body.endDate?new Date(req.body.endDate):null,unitPrice:unit.toFixed(2),totalPrice:unit.toFixed(2),notes:req.body.notes||null}});res.status(201).json(await totals(order.id));}catch(e){next(e);}});
orderRouter.patch("/items/:itemId",async(req,res,next)=>{try{const item=await prisma.conciergeOrderItem.findUnique({where:{id:req.params.itemId}});if(!item)fail("Order item not found",404);const unit=Number(money(req.body.unitPrice??item.unitPrice,"Price"));await prisma.conciergeOrderItem.update({where:{id:item.id},data:{unitPrice:unit.toFixed(2),totalPrice:unit.toFixed(2),startDate:req.body.startDate===undefined?item.startDate:req.body.startDate?new Date(req.body.startDate):null,endDate:req.body.endDate===undefined?item.endDate:req.body.endDate?new Date(req.body.endDate):null,notes:req.body.notes===undefined?item.notes:req.body.notes||null}});res.json(await totals(item.orderId));}catch(e){next(e);}});
orderRouter.delete("/items/:itemId",async(req,res,next)=>{try{const item=await prisma.conciergeOrderItem.findUnique({where:{id:req.params.itemId}});if(!item)fail("Order item not found",404);await prisma.conciergeOrderItem.delete({where:{id:item.id}});res.json(await totals(item.orderId));}catch(e){next(e);}});
orderRouter.post("/",async(req,res,next)=>{try{const individual=await findOrCreateIndividual(req.body,req.adminUser!.id);const itemData=(Array.isArray(req.body.items)?req.body.items:[]).map((x:any)=>{const unit=Number(money(x.unitPrice,"Price"));return{productType:String(x.productType),productId:x.productId||null,productName:String(x.productName),planId:x.planId||null,planName:x.planName||null,optionId:x.optionId||null,optionName:x.optionName||null,startDate:x.startDate?new Date(x.startDate):null,endDate:x.endDate?new Date(x.endDate):null,unitPrice:unit.toFixed(2),totalPrice:unit.toFixed(2),notes:x.notes||null};});if(!itemData.length)fail("Add at least one product");const total=itemData.reduce((s:any,x:any)=>s+Number(x.totalPrice),0);const row=await prisma.conciergeOrder.create({data:{orderNumber:orderNumber(),contactRequestId:req.body.contactRequestId||null,individualId:individual.id,clientFirstName:String(req.body.clientFirstName).trim(),clientLastName:String(req.body.clientLastName).trim(),clientEmail:email(req.body.clientEmail),clientPhone:phone(req.body.clientPhone),clientLanguage:String(req.body.clientLanguage||"en"),currency:String(req.body.currency||"EUR"),totalAmount:total.toFixed(2),remainingAmount:total.toFixed(2),notes:req.body.notes||null,createdBy:req.adminUser!.id,updatedBy:req.adminUser!.id,items:{create:itemData}},include:{items:true,payments:true,individual:true}});res.status(201).json(row);}catch(e){next(e);}});
orderRouter.post("/:id/confirm", async (req, res, next) => {
  try {
    if (!isStripePaymentAvailable()) {
      fail("Online payment is temporarily unavailable", 503);
    }
    const amount = Number(money(req.body.amount, "Advance amount"));
    const { order, payment } = await createOrReusePaymentRequest(
      req.params.id,
      amount,
      req.adminUser!.id,
    );

    await sendPaymentEmail(order, payment);
    await prisma.conciergeOrderPayment.update({
      where: { id: payment.id },
      data: { emailSentAt: new Date() },
    });

    res.json(await totals(order.id));
  } catch (error) {
    next(error);
  }
});

orderRouter.post("/:id/payments",async(req,res,next)=>{try{const order=await prisma.conciergeOrder.findUnique({where:{id:req.params.id}});if(!order)fail("Order not found",404);const amount=money(req.body.amount,"Payment amount");if(Number(amount)<=0||Number(amount)>Number(order.remainingAmount))fail("Payment must be greater than zero and no more than the remaining balance");await prisma.conciergeOrderPayment.create({data:{orderId:order.id,amount,currency:order.currency,method:req.body.method||"CASH",status:"PAID",paidAt:new Date(),recordedBy:req.adminUser!.id,notes:req.body.notes||null}});res.status(201).json(await totals(order.id));}catch(e){next(e);}});
