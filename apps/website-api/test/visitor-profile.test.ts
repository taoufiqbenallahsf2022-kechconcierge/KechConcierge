import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/config/prisma";
import { recordVisitor } from "../src/services/visitor-profile.service";
import { claimVisitorJourney } from "../src/services/visitor-journey.service";

test("visitor first source survives return visits; identities and history stay scoped to journeys", { skip: process.env.RUN_LOCAL_DB_TESTS !== "1" }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname));
  const visitorId = `qa_visitor_${randomUUID()}`, individualId = `qa_individual_${randomUUID()}`;
  const journeyA = `qa_journey_${randomUUID()}`, journeyB = `qa_journey_${randomUUID()}`;
  try {
    await recordVisitor({ visitorId, source: "tiktok", pageUrl: "/?source=tiktok", userAgent: "iPhone Mobile", language: "fr" });
    await recordVisitor({ visitorId, source: "instagram", firstName: "QA", email: "qa@example.invalid" });
    let visitor = await prisma.visitor.findUniqueOrThrow({ where: { id: visitorId } });
    assert.equal(visitor.source, "tiktok"); assert.equal(visitor.lastSource, "instagram"); assert.equal(visitor.deviceType, "mobile"); assert.equal(visitor.email, "qa@example.invalid");
    await prisma.individual.create({ data: { id: individualId, firstName: "QA", lastName: "Fixture", language: "fr", source: "WEBSITE" } });
    await prisma.visitorJourney.createMany({ data: [{ id: journeyA, visitorId }, { id: journeyB, visitorId }] });
    await prisma.pageVisit.createMany({ data: [{ visitorId, journeyId: journeyA, visitorStage: "ANONYMOUS", pageUrl: "/villas" }, { visitorId, journeyId: journeyB, visitorStage: "ANONYMOUS", pageUrl: "/restaurants" }] });
    await claimVisitorJourney(visitorId, journeyA, individualId);
    const individual = await prisma.individual.findUniqueOrThrow({ where: { id: individualId } });
    assert.equal(individual.acquisitionSource, "tiktok"); assert.equal(individual.source, "WEBSITE");
    assert.equal(await prisma.visitorIdentity.count({ where: { visitorId, individualId } }), 1);
    const visits = await prisma.pageVisit.findMany({ where: { visitorId } });
    assert.equal(visits.find(v => v.journeyId === journeyA)!.individualId, individualId);
    assert.equal(visits.find(v => v.journeyId === journeyB)!.individualId, null);
    await recordVisitor({ visitorId, source: "facebook", individualId });
    assert.equal((await prisma.individual.findUniqueOrThrow({ where: { id: individualId } })).acquisitionSource, "tiktok");
  } finally {
    await prisma.pageVisit.deleteMany({ where: { visitorId } });
    await prisma.visitorJourney.deleteMany({ where: { visitorId } });
    await prisma.visitor.deleteMany({ where: { id: visitorId } });
    await prisma.individual.deleteMany({ where: { id: individualId } });
    await prisma.$disconnect();
  }
});
