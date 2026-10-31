import { createHash } from "node:crypto";
import { Router } from "express";
import { Resend } from "resend";
import { prisma } from "../lib/prisma.js";

const METRICS = ["sent", "delivered", "opened", "clicked", "bounced"] as const;
type Metric = (typeof METRICS)[number];

function range(query: Record<string, unknown>) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const defaultFrom = new Date(today);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 6);
  defaultFrom.setUTCHours(0, 0, 0, 0);
  const from = typeof query.from === "string" ? new Date(`${query.from}T00:00:00.000Z`) : defaultFrom;
  const to = typeof query.to === "string" ? new Date(`${query.to}T23:59:59.999Z`) : today;
  if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf()) || from > to) {
    const error = new Error("Invalid reporting date range") as Error & { status?: number };
    error.status = 400;
    throw error;
  }
  return { from, to };
}

function dayKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function days(from: Date, to: Date) {
  const result: string[] = [];
  for (const current = new Date(from); current <= to; current.setUTCDate(current.getUTCDate() + 1)) result.push(dayKey(current));
  return result;
}

function page(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(query.pageSize) || 25));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function audienceWhere(value: unknown) {
  if (value === "known") return { individualId: { not: null } };
  if (value === "visitor") return { individualId: null };
  return {};
}

function resendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw Object.assign(new Error("RESEND_API_KEY is not configured"), { status: 503 });
  return new Resend(key);
}

async function syncSentEmails(from: Date) {
  let after: string | undefined;
  for (let request = 0; request < 5; request += 1) {
    const response = await resendClient().emails.list({ limit: 100, ...(after ? { after } : {}) });
    if (response.error) throw Object.assign(new Error(response.error.message), { status: 502 });
    const rows = response.data?.data ?? [];
    if (!rows.length) break;
    for (const row of rows) {
      const sentAt = new Date(row.created_at);
      await prisma.emailMessage.upsert({
        where: { resendEmailId: row.id },
        create: {
          resendEmailId: row.id,
          messageId: row.message_id ?? null,
          recipientEmail: Array.isArray(row.to) ? row.to[0] ?? "unknown" : row.to ?? "unknown",
          senderEmail: row.from ?? null,
          subject: row.subject ?? null,
          lastEvent: row.last_event ?? null,
          sentAt,
          lastEventAt: sentAt,
        },
        update: { messageId: row.message_id ?? undefined, lastEvent: row.last_event ?? undefined },
      });
    }
    const lastRow = rows[rows.length - 1];
    if (!lastRow) break;
    const oldest = new Date(lastRow.created_at);
    if (rows.length < 100 || oldest < from) break;
    after = lastRow.id;
  }
}

function localSeries(keys: string[], rows: Array<{ date: Date; metric: Metric }>) {
  const byDay = new Map(keys.map((date) => [date, Object.fromEntries(METRICS.map((metric) => [metric, 0])) as Record<Metric, number>]));
  for (const row of rows) {
    const bucket = byDay.get(dayKey(row.date));
    if (bucket) bucket[row.metric] += 1;
  }
  return keys.map((date) => ({ date, ...byDay.get(date)! }));
}

export const performanceRouter = Router();

performanceRouter.get("/emails/overview", async (req, res, next) => {
  try {
    const { from, to } = range(req.query);
    const email = String(req.query.email ?? "").trim();
    await syncSentEmails(from).catch(() => undefined);
    if (!email) {
      try {
        const response = await resendClient().emails.metrics({
          startDate: from.toISOString(),
          endDate: to.toISOString(),
          granularity: "daily",
          timezone: "UTC",
          metrics: [...METRICS],
          dimensions: ["period"],
        });
        if (response.error) throw new Error(response.error.message);
        const raw = response.data?.data ?? [];
        const returned = raw.map((row: any) => ({
          date: String(row.period ?? row.date ?? "").slice(0, 10),
          ...Object.fromEntries(METRICS.map((metric) => [metric, Number(row[metric] ?? 0)])),
        }));
        const returnedByDay = new Map(returned.map((row: any) => [row.date, row]));
        const normalized = days(from, to).map((date) => returnedByDay.get(date) ?? ({ date, ...Object.fromEntries(METRICS.map((metric) => [metric, 0])) }));
        const totals = Object.fromEntries(METRICS.map((metric) => [metric, Number(response.data?.totals?.[metric] ?? normalized.reduce((sum: number, row: any) => sum + Number(row[metric] ?? 0), 0))]));
        return res.json({ from, to, timezone: "GMT", source: "resend", totals, series: normalized });
      } catch {
        // Local data remains available if Resend metrics are temporarily unavailable.
      }
    }
    const messageWhere = { sentAt: { gte: from, lte: to }, ...(email ? { recipientEmail: { contains: email, mode: "insensitive" as const } } : {}) };
    const eventWhere = { occurredAt: { gte: from, lte: to }, ...(email ? { recipientEmail: { contains: email, mode: "insensitive" as const } } : {}) };
    const [messages, events] = await Promise.all([
      prisma.emailMessage.findMany({ where: messageWhere, select: { sentAt: true } }),
      prisma.emailEvent.findMany({ where: eventWhere, select: { occurredAt: true, type: true } }),
    ]);
    const rows: Array<{ date: Date; metric: Metric }> = messages.map((item) => ({ date: item.sentAt, metric: "sent" }));
    for (const event of events) {
      const metric = event.type.replace("email.", "") as Metric;
      if (METRICS.includes(metric) && metric !== "sent") rows.push({ date: event.occurredAt, metric });
    }
    const series = localSeries(days(from, to), rows);
    const totals = Object.fromEntries(METRICS.map((metric) => [metric, series.reduce((sum, row) => sum + row[metric], 0)]));
    res.json({ from, to, timezone: "GMT", source: "captured", totals, series });
  } catch (error) { next(error); }
});

performanceRouter.get("/emails/items", async (req, res, next) => {
  try {
    const { from, to } = range(req.query);
    const paging = page(req.query);
    const metric = METRICS.includes(req.query.metric as Metric) ? req.query.metric as Metric : "sent";
    const email = String(req.query.email ?? "").trim();
    if (metric === "sent") {
      const where = { sentAt: { gte: from, lte: to }, ...(email ? { recipientEmail: { contains: email, mode: "insensitive" as const } } : {}) };
      const [items, total] = await Promise.all([
        prisma.emailMessage.findMany({ where, orderBy: { sentAt: "desc" }, skip: paging.skip, take: paging.pageSize }),
        prisma.emailMessage.count({ where }),
      ]);
      return res.json({ items: items.map((item) => ({ id: item.resendEmailId, email: item.recipientEmail, subject: item.subject, event: item.lastEvent || "sent", date: item.sentAt })), total, page: paging.page, pageSize: paging.pageSize, pages: Math.ceil(total / paging.pageSize) });
    }
    const where = { type: `email.${metric}`, occurredAt: { gte: from, lte: to }, ...(email ? { recipientEmail: { contains: email, mode: "insensitive" as const } } : {}) };
    const [items, total] = await Promise.all([
      prisma.emailEvent.findMany({ where, orderBy: { occurredAt: "desc" }, skip: paging.skip, take: paging.pageSize, include: { message: { select: { subject: true } } } }),
      prisma.emailEvent.count({ where }),
    ]);
    res.json({ items: items.map((item) => ({ id: item.resendEmailId, email: item.recipientEmail, subject: item.message.subject, event: metric, date: item.occurredAt, link: item.link, bounceType: item.bounceType })), total, page: paging.page, pageSize: paging.pageSize, pages: Math.ceil(total / paging.pageSize) });
  } catch (error) { next(error); }
});

performanceRouter.get("/engagement/overview", async (req, res, next) => {
  try {
    const { from, to } = range(req.query);
    const requestType = String(req.query.requestType ?? "");
    const sharedAudience = audienceWhere(req.query.audience);
    const contactWhere = { createdDate: { gte: from, lte: to }, ...sharedAudience, ...(requestType ? { requestType: requestType as any } : {}) };
    const chatWhere = { createdDate: { gte: from, lte: to }, ...sharedAudience };
    const [contacts, chats] = await Promise.all([
      prisma.contactRequest.findMany({ where: contactWhere, select: { id: true, createdDate: true, requestType: true } }),
      prisma.chat.findMany({ where: chatWhere, select: { id: true, createdDate: true, status: true } }),
    ]);
    const keys = days(from, to);
    const daily = keys.map((date) => ({ date, contacts: contacts.filter((x) => dayKey(x.createdDate) === date).length, chats: chats.filter((x) => dayKey(x.createdDate) === date).length }));
    const byRequestType = contacts.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.requestType]: (acc[row.requestType] ?? 0) + 1 }), {});
    const byChatStatus = chats.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }), {});
    res.json({ timezone: "GMT", totals: { contacts: contacts.length, chats: chats.length }, byRequestType, byChatStatus, series: daily });
  } catch (error) { next(error); }
});

performanceRouter.get("/engagement/items", async (req, res, next) => {
  try {
    const { from, to } = range(req.query);
    const paging = page(req.query);
    const kind = req.query.kind === "chats" ? "chats" : "contacts";
    const metric = String(req.query.metric ?? "total");
    const shared = { ...audienceWhere(req.query.audience) };
    if (kind === "contacts") {
      const where = { createdDate: { gte: from, lte: to }, ...shared, ...(metric !== "total" ? { requestType: metric as any } : {}) };
      const [items, total] = await Promise.all([
        prisma.contactRequest.findMany({ where, orderBy: { createdDate: "desc" }, skip: paging.skip, take: paging.pageSize, select: { id: true, firstName: true, lastName: true, email: true, requestType: true, individualId: true, createdDate: true } }),
        prisma.contactRequest.count({ where }),
      ]);
      return res.json({ items, total, page: paging.page, pageSize: paging.pageSize, pages: Math.ceil(total / paging.pageSize) });
    }
    const where = { createdDate: { gte: from, lte: to }, ...shared, ...(metric !== "total" ? { status: metric as any } : {}) };
    const [items, total] = await Promise.all([
      prisma.chat.findMany({ where, orderBy: { createdDate: "desc" }, skip: paging.skip, take: paging.pageSize, select: { id: true, visitorId: true, individualId: true, participantStage: true, status: true, language: true, createdDate: true } }),
      prisma.chat.count({ where }),
    ]);
    res.json({ items, total, page: paging.page, pageSize: paging.pageSize, pages: Math.ceil(total / paging.pageSize) });
  } catch (error) { next(error); }
});

performanceRouter.get("/page-visits/overview", async (req, res, next) => {
  try {
    const { from, to } = range(req.query);
    const search = String(req.query.search ?? "").trim();
    const where = { visitDate: { gte: from, lte: to }, ...audienceWhere(req.query.audience), ...(search ? { OR: [{ pageUrl: { contains: search, mode: "insensitive" as const } }, { pageName: { contains: search, mode: "insensitive" as const } }] } : {}) };
    const visits = await prisma.pageVisit.findMany({ where, select: { visitDate: true, pageUrl: true, pageName: true, visitorId: true, individualId: true } });
    const unique = new Set(visits.map((visit, index) => visit.individualId ? `i:${visit.individualId}` : visit.visitorId ? `v:${visit.visitorId}` : `anonymous:${index}`));
    const topMap = new Map<string, { pageUrl: string; pageName: string | null; visits: number }>();
    for (const visit of visits) {
      const row = topMap.get(visit.pageUrl) ?? { pageUrl: visit.pageUrl, pageName: visit.pageName, visits: 0 };
      row.visits += 1; topMap.set(visit.pageUrl, row);
    }
    const series = days(from, to).map((date) => ({ date, visits: visits.filter((visit) => dayKey(visit.visitDate) === date).length }));
    res.json({ timezone: "GMT", totals: { visits: visits.length, visitors: unique.size }, series, topPages: [...topMap.values()].sort((a, b) => b.visits - a.visits).slice(0, 15) });
  } catch (error) { next(error); }
});

performanceRouter.get("/page-visits/items", async (req, res, next) => {
  try {
    const { from, to } = range(req.query);
    const paging = page(req.query);
    const pageUrl = String(req.query.pageUrl ?? "");
    const search = String(req.query.search ?? "").trim();
    const where = { visitDate: { gte: from, lte: to }, ...audienceWhere(req.query.audience), ...(pageUrl ? { pageUrl } : {}), ...(search ? { OR: [{ pageUrl: { contains: search, mode: "insensitive" as const } }, { pageName: { contains: search, mode: "insensitive" as const } }] } : {}) };
    const [items, total] = await Promise.all([
      prisma.pageVisit.findMany({ where, orderBy: { visitDate: "desc" }, skip: paging.skip, take: paging.pageSize, select: { id: true, pageUrl: true, pageName: true, visitorId: true, individualId: true, visitorStage: true, referrer: true, visitDate: true } }),
      prisma.pageVisit.count({ where }),
    ]);
    res.json({ items, total, page: paging.page, pageSize: paging.pageSize, pages: Math.ceil(total / paging.pageSize) });
  } catch (error) { next(error); }
});

export const resendWebhookRouter = Router();
resendWebhookRouter.post("/", async (req, res, next) => {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) throw Object.assign(new Error("RESEND_WEBHOOK_SECRET is not configured"), { status: 503 });
    const resend = new Resend(process.env.RESEND_API_KEY);
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);
    const event = resend.webhooks.verify({
      payload: raw,
      headers: {
        id: String(req.headers["svix-id"] ?? ""),
        timestamp: String(req.headers["svix-timestamp"] ?? ""),
        signature: String(req.headers["svix-signature"] ?? ""),
      },
      webhookSecret: secret,
    }) as any;
    const data = event.data ?? {};
    const resendEmailId = data.email_id ?? data.id;
    if (!resendEmailId) return res.status(202).json({ received: true });
    const occurredAt = new Date(event.created_at ?? Date.now());
    const recipientEmail = Array.isArray(data.to) ? data.to[0] ?? "unknown" : data.to ?? "unknown";
    await prisma.emailMessage.upsert({
      where: { resendEmailId },
      create: { resendEmailId, messageId: data.message_id ?? null, recipientEmail, senderEmail: data.from ?? null, subject: data.subject ?? null, lastEvent: event.type, sentAt: occurredAt, lastEventAt: occurredAt },
      update: { lastEvent: event.type, lastEventAt: occurredAt, recipientEmail, subject: data.subject ?? undefined },
    });
    const webhookEventId = String(req.headers["svix-id"] ?? createHash("sha256").update(`${event.type}:${resendEmailId}:${occurredAt.toISOString()}:${recipientEmail}:${data.click?.link ?? ""}`).digest("hex"));
    await prisma.emailEvent.upsert({
      where: { webhookEventId },
      create: { webhookEventId, resendEmailId, type: event.type, recipientEmail, occurredAt, link: data.click?.link ?? null, bounceType: data.bounce?.type ?? null, payload: event },
      update: {},
    });
    res.json({ received: true });
  } catch (error) { next(error); }
});
