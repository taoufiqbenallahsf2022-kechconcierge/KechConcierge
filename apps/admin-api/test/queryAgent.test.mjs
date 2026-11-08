import assert from "node:assert/strict";
import test from "node:test";
import { validateReportingSql } from "../dist/apps/admin-api/src/services/queryAgentSql.js";

test("permits source aggregation, CTEs, joins, date filters and grouping", () => {
  for (const sql of [
    "SELECT source, COUNT(*) FROM reporting_visitors GROUP BY source",
    'SELECT "id", "titleEN" FROM "Villa" WHERE "createdAt" >= CURRENT_DATE - INTERVAL \'3 months\'',
    'SELECT "email" FROM query_agent."User"',
    'SELECT count(*) FROM "TransportationPlan"',

    "WITH v AS (SELECT * FROM reporting_visitors) SELECT COUNT(*) FROM v",
    "SELECT v.source, COUNT(DISTINCT i.individual_id) FROM reporting_visitors v LEFT JOIN reporting_visitor_identities i ON i.visitor_id = v.id GROUP BY v.source",
    "SELECT count(*) FROM reporting_visitors WHERE first_seen_at >= CURRENT_DATE",
    "SELECT date_trunc('day', first_seen_at), count(*) FROM reporting_visitors GROUP BY 1",
  ]) assert.ok(validateReportingSql(sql));
});

test("rejects writes, multiple statements, base tables and system access", () => {
  for (const sql of [
    'DELETE FROM reporting_visitors', 'SELECT * FROM public."User"',
    "SELECT pg_read_file('/etc/passwd') FROM reporting_visitors",
    'SELECT * FROM pg_catalog.pg_authid', 'SELECT * FROM reporting_visitors; DELETE FROM "Visitor"',
    'WITH v AS (DELETE FROM "Visitor" RETURNING *) SELECT * FROM v',
    'SELECT pg_sleep(60) FROM reporting_visitors', 'SELECT * INTO x FROM reporting_visitors',
    "SELECT set_config('transaction_read_only','off',true) FROM reporting_visitors",
    'SELECT * FROM private.reporting_visitors', "SELECT id::regclass FROM reporting_visitors",
    'WITH "User" AS (SELECT * FROM reporting_visitors) SELECT * FROM public."User"',
    'SELECT 1',
    'WITH nested AS (WITH "private_secret" AS (SELECT * FROM reporting_visitors) SELECT * FROM "private_secret") SELECT * FROM "private_secret"',
  ]) assert.throws(() => validateReportingSql(sql), sql);
});
