import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";
import routes from "../src/routes/interaction.routes";
import { prisma } from "../src/config/prisma";
import { claimVisitorJourney } from "../src/services/visitor-journey.service";
import { recordInteractionOutcome, safeInteractionMetadata, safeInteractionPath } from "../src/services/interaction.service";

test("interaction payloads exclude private fields and secret-bearing URL values", () => {
  assert.equal(safeInteractionPath("/pay/private-access-token?email=private@example.invalid"), "/pay/:token");
  assert.equal(safeInteractionPath("/reset-password?token=private"), "/reset-password");
  assert.deepEqual(safeInteractionMetadata({ email: "private", password: "private", message: "private", status: "success", destination: "/account?section=preferences&token=private" }), { status: "success", destination: "/account?section=preferences" });
});

test("batch ingestion deduplicates, correlates page visits and claims only the verified identity's journey", { skip: process.env.RUN_LOCAL_DB_TESTS !== "1" }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname));
  const visitorId = `qa_interaction_${randomUUID()}`, journeyId = `qa_journey_${randomUUID()}`, otherJourney = `qa_other_${randomUUID()}`;
  const individualId = `qa_person_${randomUUID()}`, otherIndividual = `qa_other_person_${randomUUID()}`, pageInstanceId = randomUUID();
  process.env.JWT_SECRET ||= randomUUID();
  const app = express(); app.use(express.json()); app.use("/interactions", routes);
  app.post("/confirmed", async (req, res) => { await recordInteractionOutcome(req, "request_submitted", "qa_request", "contact-request"); res.status(204).end(); });
  app.use((error: any, _req: any, res: any, _next: any) => res.status(error.status || 500).json({ message: error.message }));
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const headers = { "Content-Type": "application/json", "x-visitor-id": visitorId, "x-journey-id": journeyId, "x-session-id": randomUUID(), "x-page-instance-id": pageInstanceId, "x-page-url": "/contact", "User-Agent": "Mozilla/5.0 (iPad) Version/17.0 Safari/605.1" };
  const event = { id: randomUUID(), pageInstanceId, eventType: "click", pageUrl: "/villas/qa", component: "product", target: "open-plans", occurredAt: new Date().toISOString(), sequence: 1, viewportWidth: 768, viewportHeight: 1024, metadata: { status: "success", password: "never-store" }, authenticated: true, individualId: "forged" };
  const send = (events: any[], extra = {}) => fetch(`${base}/interactions`, { method: "POST", headers: { ...headers, ...extra }, body: JSON.stringify({ events }) });
  try {
    await prisma.visitor.create({ data: { id: visitorId, source: "instagram", lastSource: "instagram" } });
    await prisma.visitorJourney.createMany({ data: [{ id: journeyId, visitorId }, { id: otherJourney, visitorId }] });
    const page = await prisma.pageVisit.create({ data: { visitorId, journeyId, clientPageInstanceId: pageInstanceId, visitorStage: "ANONYMOUS", pageUrl: "/villas/qa", source: "tiktok" } });
    const first = await send([event]); assert.equal(first.status, 200, await first.clone().text()); assert.equal((await first.json()).accepted, 1);
    assert.equal((await (await send([event])).json()).accepted, 0);
    let saved = await prisma.interaction.findUniqueOrThrow({ where: { id: event.id } });
    assert.equal(saved.individualId, null); assert.equal(saved.authenticated, false); assert.equal(saved.source, "tiktok");
    assert.equal(saved.deviceType, "tablet"); assert.equal(saved.pageVisitId, page.id); assert.deepEqual(saved.metadata, { status: "success" });
    assert.equal((await send([{ ...event, id: randomUUID(), eventType: "request_submitted", producer: "SERVER" }])).status, 400);
    assert.equal((await send(Array.from({ length: 26 }, () => event))).status, 400);
    assert.equal((await send([{ ...event, id: randomUUID(), viewportWidth: -1 }])).status, 400);
    assert.equal((await send([{ ...event, id: randomUUID() }], { Authorization: "Bearer invalid" })).status, 401);
    const otherEvent = { ...event, id: randomUUID() }; assert.equal((await send([otherEvent], { "x-journey-id": otherJourney })).status, 200);
    await prisma.individual.createMany({ data: [{ id: individualId, firstName: "QA", lastName: "One", language: "en", source: "QA", isActive: true }, { id: otherIndividual, firstName: "QA", lastName: "Two", language: "en", source: "QA", isActive: true }] });
    await claimVisitorJourney(visitorId, journeyId, individualId);
    saved = await prisma.interaction.findUniqueOrThrow({ where: { id: event.id } });
    assert.equal(saved.individualId, individualId); assert.equal(saved.authenticated, false);
    assert.equal((await prisma.interaction.findUniqueOrThrow({ where: { id: otherEvent.id } })).individualId, null);
    const token = jwt.sign({ individualId }, process.env.JWT_SECRET!, { expiresIn: "1m" });
    const logged = { ...event, id: randomUUID() }; assert.equal((await send([logged], { Authorization: `Bearer ${token}` })).status, 200);
    assert.equal((await prisma.interaction.findUniqueOrThrow({ where: { id: logged.id } })).authenticated, true);
    const conflictToken = jwt.sign({ individualId: otherIndividual }, process.env.JWT_SECRET!, { expiresIn: "1m" });
    assert.equal((await send([{ ...event, id: randomUUID() }], { Authorization: `Bearer ${conflictToken}` })).status, 409);
    const confirmed = await fetch(`${base}/confirmed`, { method: "POST", headers, body: "{}" }); assert.equal(confirmed.status, 204);
    assert.equal(await prisma.interaction.count({ where: { visitorId, producer: "SERVER", eventType: "request_submitted" } }), 1);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await prisma.pageVisit.deleteMany({ where: { visitorId } });
    await prisma.visitorJourney.deleteMany({ where: { visitorId } });
    await prisma.visitor.deleteMany({ where: { id: visitorId } });
    await prisma.individual.deleteMany({ where: { id: { in: [individualId, otherIndividual] } } });
    await prisma.$disconnect();
  }
});
