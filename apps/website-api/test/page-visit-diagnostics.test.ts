import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";
import visits from "../src/routes/page-visit.routes";
import { prisma } from "../src/config/prisma";

test("visit evidence separates anonymous account requests from verified access and scopes outcome updates", { skip: process.env.RUN_LOCAL_DB_TESTS !== "1" }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname));
  const visitorId = `qa_diagnostics_${randomUUID()}`, journeyId = `qa_journey_${randomUUID()}`;
  const individualId = `qa_individual_${randomUUID()}`;
  process.env.JWT_SECRET ||= randomUUID();
  const app = express(); app.use(express.json()); app.use("/visits", visits);
  app.use((error: any, _req: any, res: any, _next: any) => res.status(error.status || 500).json({ message: error.message }));
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}/visits`;
  const headers = { "Content-Type": "application/json", "x-visitor-id": visitorId, "x-journey-id": journeyId, Origin: "https://moorishconcierge.com", "User-Agent": "QA diagnostics fixture" };
  try {
    const response = await fetch(base, { method: "POST", headers, body: JSON.stringify({
      pageUrl: "/account?section=preferences", navigationType: "navigate", language: "fr-MA", webdriver: true,
      clientVisitedAt: new Date().toISOString(), previousPageUrl: "/villas?token=private", clickedLinkUrl: "/account?section=preferences&email=private@example.invalid",
      authenticationStatus: "AUTHENTICATED", accessOutcome: "ACCOUNT_DATA_LOADED",
    }) });
    assert.equal(response.status, 201, await response.clone().text());
    const { id } = await response.json();
    const record = await prisma.pageVisit.findUniqueOrThrow({ where: { id } });
    assert.equal(record.authenticationStatus, "ANONYMOUS"); assert.equal(record.accessOutcome, "REQUESTED_NOT_CONFIRMED");
    assert.equal(record.previousPageUrl, "/villas"); assert.equal(record.clickedLinkUrl, "/account?section=preferences");
    assert.equal(record.webdriver, true); assert.equal(record.browserLanguage, "fr-MA"); assert.equal(record.requestOrigin, "https://moorishconcierge.com");
    const update = (outcome: string, extra = {}) => fetch(`${base}/${id}/access`, { method: "PATCH", headers: { ...headers, ...extra }, body: JSON.stringify({ outcome }) });
    assert.equal((await update("ACCOUNT_DATA_LOADED")).status, 401);
    assert.equal((await update("REDIRECTED_UNAUTHENTICATED", { "x-visitor-id": `other_${randomUUID()}` })).status, 404);
    assert.equal((await update("REDIRECTED_UNAUTHENTICATED")).status, 204);
    assert.equal((await prisma.pageVisit.findUniqueOrThrow({ where: { id } })).accessOutcome, "REDIRECTED_UNAUTHENTICATED");

    await prisma.individual.create({ data: { id: individualId, firstName: "QA", lastName: "Fixture", language: "en", source: "QA" } });
    const token = jwt.sign({ individualId }, process.env.JWT_SECRET!, { expiresIn: "1m" });
    const signedHeaders = { ...headers, Authorization: `Bearer ${token}` };
    const signed = await fetch(base, { method: "POST", headers: signedHeaders, body: JSON.stringify({ pageUrl: "/account?section=preferences" }) });
    assert.equal(signed.status, 201); const signedVisit = await signed.json();
    const loaded = await fetch(`${base}/${signedVisit.id}/access`, { method: "PATCH", headers: signedHeaders, body: JSON.stringify({ outcome: "ACCOUNT_DATA_LOADED" }) });
    assert.equal(loaded.status, 204);
    const verified = await prisma.pageVisit.findUniqueOrThrow({ where: { id: signedVisit.id } });
    assert.equal(verified.authenticationStatus, "AUTHENTICATED"); assert.equal(verified.accessOutcome, "ACCOUNT_DATA_LOADED");
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await prisma.pageVisit.deleteMany({ where: { visitorId } });
    await prisma.visitorJourney.deleteMany({ where: { visitorId } });
    await prisma.visitor.deleteMany({ where: { id: visitorId } });
    await prisma.individual.deleteMany({ where: { id: individualId } });
    await prisma.$disconnect();
  }
});
