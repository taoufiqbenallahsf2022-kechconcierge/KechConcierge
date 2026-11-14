import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import { prisma, pool } from "../dist/apps/admin-api/src/lib/prisma.js";
import { visitorRouter } from "../dist/apps/admin-api/src/routes/visitorRoutes.js";
import { interactionRouter } from "../dist/apps/admin-api/src/routes/interactionRoutes.js";

test("Data Hub interactions are paginated, filterable and available to Query Agent", { skip: process.env.RUN_LOCAL_DB_TESTS !== "1" }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname));
  const visitorId = `qa_admin_interactions_${randomUUID()}`, journeyId = `qa_journey_${randomUUID()}`;
  const app = express(); app.use("/interactions", interactionRouter); app.use("/visitors", visitorRouter); app.use((e, _q, r, _n) => r.status(500).json({ message: e.message }));
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/interactions`;
  try {
    await prisma.visitor.create({ data: { id: visitorId } });
    await prisma.visitorJourney.create({ data: { id: journeyId, visitorId } });
    await prisma.interaction.createMany({ data: Array.from({ length: 26 }, (_, sequence) => ({ id: randomUUID(), visitorId, journeyId, pageInstanceId: randomUUID(), eventType: sequence % 2 ? "hover" : "click", pageUrl: "/villas/qa", occurredAt: new Date(), sequence, source: "instagram", deviceType: "mobile", metadata: { direction: "right" } })) });
    const visitorBase = base.replace(/\/interactions$/, "/visitors");
    const visitor = await fetch(`${visitorBase}/${visitorId}`).then(r => r.json()); assert.equal(visitor.counts.interactions, 26);
    const activity = await fetch(`${visitorBase}/${visitorId}/activity?type=interaction`).then(r => r.json());
    assert.equal(activity.items.length, 25); assert.equal(activity.hasMore, true); assert.ok(activity.items.every(row => row.kind === "interaction"));
    assert.equal(activity.items[0].source, "instagram");
    assert.equal(activity.items[0].interaction.pageUrl, "/villas/qa");
    assert.equal(activity.items[0].interaction.metadata.direction, "right");
    assert.equal(activity.items[0].interaction.deviceType, "mobile");
    const activityNext = await fetch(`${visitorBase}/${visitorId}/activity?type=interaction&page=2`).then(r => r.json()); assert.equal(activityNext.items.length, 1);
    const combined = await fetch(`${visitorBase}/${visitorId}/activity`).then(r => r.json()); assert.equal(combined.items[0].kind, "interaction");
    const first = await fetch(`${base}?visitorId=${visitorId}`).then(r => r.json()); assert.equal(first.total, 26); assert.equal(first.items.length, 25);
    const second = await fetch(`${base}?visitorId=${visitorId}&page=2`).then(r => r.json()); assert.equal(second.items.length, 1);
    const clicks = await fetch(`${base}?visitorId=${visitorId}&eventType=click&deviceType=mobile&source=instagram`).then(r => r.json()); assert.equal(clicks.total, 13);
    const detail = await fetch(`${base}/${first.items[0].id}`).then(r => r.json()); assert.equal(detail.visitorId, visitorId); assert.equal(detail.metadata.direction, "right");
    assert.equal((await fetch(`${base}?from=bad-date`)).status, 400);
    assert.equal((await fetch(`${base}/missing`)).status, 404);
    const result = await prisma.$queryRawUnsafe('SELECT count(*)::int AS total FROM query_agent."Interaction" WHERE "visitorId" = $1 AND "metadata"->>\'direction\' = \'right\'', visitorId);
    assert.equal(result[0].total, 26);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await prisma.visitorJourney.deleteMany({ where: { visitorId } });
    await prisma.visitor.deleteMany({ where: { id: visitorId } });
    await prisma.$disconnect(); await pool.end();
  }
});
