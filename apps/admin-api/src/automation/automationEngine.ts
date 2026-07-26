import { prisma } from "../lib/prisma.js";

const UNSAFE_SQL = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|execute|merge|vacuum|analyze|refresh|reindex|pg_sleep|pg_read_file|pg_read_binary_file|pg_ls_dir|lo_import|dblink)\b/i;
export function safeSelect(raw: unknown) {
  if (typeof raw !== "string" || !raw.trim()) throw Object.assign(new Error("SQL query is required"), { status: 400 });
  const query = raw.trim().replace(/;\s*$/, "");
  if (!/^(select|with)\b/i.test(query) || UNSAFE_SQL.test(query) || /;|--|\/\*|\*\//.test(query))
    throw Object.assign(new Error("Only one read-only SELECT query is allowed."), { status: 400 });
  return query;
}
const serialize = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v instanceof Date ? v.toISOString() : v]));
export async function audience(sql: string, limit: number) {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM (${safeSelect(sql)}) AS "audience" LIMIT ${limit}`);
  return rows.map(serialize);
}
const escapeHtml = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const render = (template: string, row: Record<string, unknown>, html = false) => template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, field) => html ? escapeHtml(row[field]) : String(row[field] ?? ""));
async function deliver(input: { from: string; replyTo?: string | null; to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: input.from, to: [input.to], subject: input.subject, html: input.html, ...(input.replyTo ? { reply_to: input.replyTo } : {}) }) });
  if (!response.ok) throw new Error(`Email provider rejected delivery (${response.status})`);
}
export async function executeAutomation(id: string, startedBy: string) {
  let runId: string | null = null;
  try {
    const automation = await prisma.audienceAutomation.findUnique({ where: { id }, include: { senderEmail: true, emailTemplate: true } });
    if (!automation) throw Object.assign(new Error("Automation not found"), { status: 404 });
    if (!automation.isActive) throw Object.assign(new Error("Activate the automation before running"), { status: 400 });
    if (!automation.senderEmail.isActive || !automation.emailTemplate.isActive) throw Object.assign(new Error("The selected sender and template must be active"), { status: 400 });
    const rows = await audience(automation.sqlQuery, 1000);
    const run = await prisma.automationRun.create({ data: { automationId: id, audienceCount: rows.length, dryRun: !process.env.RESEND_API_KEY, startedBy } });
    runId = run.id;
    let deliveredCount = 0, failedCount = 0;
    const blocks = automation.emailTemplate.languageBlocks as Record<string, { subject?: string; html?: string }>;
    for (const row of rows) {
      const email = String(row[automation.emailField] ?? "").trim();
      if (!row[automation.subscriberKeyField] || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { failedCount++; continue; }
      const language = automation.languageField ? String(row[automation.languageField] ?? "").toLowerCase() : "";
      const localized = blocks?.[language];
      try {
        await deliver({ from: `${automation.senderEmail.name} <${automation.senderEmail.email}>`, replyTo: automation.senderEmail.replyTo, to: email, subject: render(localized?.subject ?? automation.emailTemplate.defaultSubject, row), html: render(localized?.html ?? automation.emailTemplate.defaultHtml, row, true) });
        deliveredCount++;
      } catch { failedCount++; }
    }
    return await prisma.automationRun.update({ where: { id: run.id }, data: { status: "COMPLETED", deliveredCount, failedCount, completedDate: new Date() } });
  } catch (error) {
    if (runId) await prisma.automationRun.update({ where: { id: runId }, data: { status: "FAILED", error: (error instanceof Error ? error.message : "Automation failed").slice(0, 1000), completedDate: new Date() } });
    throw error;
  }
}
