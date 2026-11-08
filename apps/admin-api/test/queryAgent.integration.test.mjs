import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import { prisma, pool } from "../dist/apps/admin-api/src/lib/prisma.js";
import { queryAgentRouter } from "../dist/apps/admin-api/src/routes/queryAgentRoutes.js";

test("saved SQL executes as read-only reporting and stores only execution metadata", { skip: process.env.RUN_LOCAL_DB_TESTS !== "1" }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname), "Integration test requires a local database");
  const visitorId = `qa_visitor_${randomUUID()}`, userId = `qa_admin_${randomUUID()}`;
  let server, queryId;
  try {
    await prisma.visitor.create({ data: { id: visitorId, source: "tiktok" } });
    const query = await prisma.agentQuery.create({ data: { title: "QA source report", prompt: "Count the QA TikTok visitor", model: "mock", createdBy: userId, sql: `SELECT source, COUNT(*)::int AS total FROM reporting_visitors WHERE id = '${visitorId}' GROUP BY source` } });
    queryId = query.id;
    const app = express(); app.use(express.json());
    app.use((req, _res, next) => { req.adminUser = { id: userId, role: req.get("x-qa-role") || "ADMIN" }; next(); });
    app.use("/query-agent", queryAgentRouter);
    app.use((error, _req, res, _next) => res.status(error.status || 500).json({ message: error.message }));
    server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/query-agent`;
    const result = await fetch(`${base}/${queryId}/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page: 1 }) });
    assert.equal(result.status, 200); const body = await result.json(); assert.deepEqual(body.items, [{ source: "tiktok", total: 1 }]);
    // Catalog queries use the real entity/field names, and sensitive columns do not exist in this namespace.
    await prisma.agentQuery.update({ where: { id: queryId }, data: { sql: 'SELECT "id", "titleEN" FROM "Villa" WHERE "createdAt" >= CURRENT_DATE - INTERVAL \'3 months\' LIMIT 1' } });
    const catalog = await fetch(`${base}/${queryId}/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.equal(catalog.status, 200, await catalog.text());
    await assert.rejects(prisma.$queryRawUnsafe('SELECT "passwordHash" FROM query_agent."User"'));
    await assert.rejects(prisma.$queryRawUnsafe('SELECT "token" FROM query_agent."EmailVerificationToken"'));
    await assert.rejects(prisma.$queryRawUnsafe('SELECT "publicToken" FROM query_agent."ConciergeOrderPayment"'));
    const saved = await prisma.agentQueryExecution.findFirst({ where: { queryId } });
    assert.equal(saved.status, "SUCCESS"); assert.equal(saved.rowCount, 1); assert.equal("items" in saved, false); assert.equal("results" in saved, false);
    const history = await fetch(`${base}/${queryId}`).then(response => response.json()); assert.equal(history.executionTotal, 2); assert.equal("items" in history, false);
    const denied = await fetch(`${base}/${queryId}/execute`, { method: "POST", headers: { "Content-Type": "application/json", "x-qa-role": "ADVISOR" }, body: "{}" }); assert.equal(denied.status, 403);
    // Even a tampered stored query is checked again before execution.
    await prisma.agentQuery.update({ where: { id: queryId }, data: { sql: 'DELETE FROM "Visitor"' } });
    const tampered = await fetch(`${base}/${queryId}/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); assert.notEqual(tampered.status, 200);
    assert.ok(await prisma.visitor.findUnique({ where: { id: visitorId } }));
    const failed = await prisma.agentQueryExecution.count({ where: { queryId, status: "FAILED" } }); assert.equal(failed, 1);
    await assert.rejects(prisma.$transaction(async tx => { await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY"); await tx.$executeRawUnsafe('DELETE FROM "Visitor" WHERE id = $1', visitorId); }));
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (queryId) await prisma.agentQuery.delete({ where: { id: queryId } });
    await prisma.visitor.deleteMany({ where: { id: visitorId } });
    await prisma.$disconnect();
    await pool.end();
  }
});
