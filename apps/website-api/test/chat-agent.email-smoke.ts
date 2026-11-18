// Manual opt-in end-to-end check. Requires the local website API on port 3001.
// Sends ONE real handoff email to the authorized development test recipient.
// Keeps the labeled local chat/contact request so the email's admin link works.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/config/prisma";
import { DEV_HANDOFF_EMAIL, chatAgentEnabled } from "../src/services/chat-agent.policy";
import { searchAgentProducts } from "../src/services/product.service";

if (process.env.RUN_CHAT_AGENT_EMAIL_SMOKE !== "1") throw new Error("Set RUN_CHAT_AGENT_EMAIL_SMOKE=1 to explicitly enable the real test email");
assert.ok(chatAgentEnabled());
const visitorId = `qa_chat_agent_${randomUUID()}`, journeyId = randomUUID();
const headers = { "Content-Type": "application/json", "x-visitor-id": visitorId, "x-journey-id": journeyId };
async function waitFor<T>(read: () => Promise<T>, ready: (value: T) => boolean, milliseconds = 60000) {
  const deadline = Date.now() + milliseconds;
  while (Date.now() < deadline) { const value = await read(); if (ready(value)) return value; await new Promise(resolve => setTimeout(resolve, 1000)); }
  throw new Error("Timed out waiting for the development chat worker");
}
try {
  const villa = (await searchAgentProducts("", "VILLA", "en")).find(p => Number(p.priceEuro) > 0); assert.ok(villa);
  const response = await fetch("http://localhost:3001/api/chats", { method: "POST", headers, body: JSON.stringify({ language: "en", message: `This is a development QA test by Taoufiq. My email is ${DEV_HANDOFF_EMAIL}. Please check availability of ${villa.title} (${villa.uniqueCode}) for 6 people on 20-22 December. Do not confirm a booking.` }) });
  assert.equal(response.status, 201, await response.clone().text());
  const { chat } = await response.json(); assert.equal(chat.managedBy, "AI");
  const task = await waitFor(() => prisma.chatAgentTask.findFirst({ where: { chatId: chat.id } }), value => !!value && ["COMPLETED", "FAILED"].includes(value.status));
  assert.equal(task?.status, "COMPLETED", task?.lastError || "Missing task");
  assert.equal((await prisma.chat.findUniqueOrThrow({ where: { id: chat.id } })).managedBy, "AI");
  assert.equal(await prisma.chatAgentHandoff.count({ where: { chatId: chat.id } }), 0);
  const confirmed = await fetch("http://localhost:3001/api/chats/" + chat.id + "/messages", { method: "POST", headers, body: JSON.stringify({ message: "Yes, I explicitly agree: transfer this chat to Asmaa now to check availability. My full name is Taoufiq Benallah." }) });
  assert.ok(confirmed.ok, await confirmed.clone().text());
  const consentTask = await waitFor(() => prisma.chatAgentTask.findFirst({ where: { chatId: chat.id, id: { not: task!.id } }, orderBy: { createdAt: "desc" } }), value => !!value && ["COMPLETED", "FAILED"].includes(value.status));
  assert.equal(consentTask?.status, "COMPLETED", consentTask?.lastError || "Missing consent task");
  const updated = await prisma.chat.findUniqueOrThrow({ where: { id: chat.id }, include: { advisor: true, messages: true } });
  assert.equal(updated.managedBy, "MANUAL"); assert.equal(updated.advisor?.email.toLowerCase(), "mounadi0711@gmail.com");
  const job = await waitFor(() => prisma.chatAgentHandoff.findUnique({ where: { chatId: chat.id } }), value => !!value && ["SENT", "FAILED"].includes(value.status), 25000);
  assert.equal(job?.status, "SENT", job?.lastError || "Email not sent"); assert.equal(job.recipient, DEV_HANDOFF_EMAIL);
  const request = await prisma.contactRequest.findUniqueOrThrow({ where: { id: job.contactRequestId! } });
  assert.equal(request.visitorId, visitorId); assert.equal(request.email, DEV_HANDOFF_EMAIL);
  console.log(JSON.stringify({ result: "PASS", chatId: chat.id, advisor: updated.advisor?.firstName, contactRequestId: request.id, emailStatus: job.status, emailRecipient: job.recipient, aiReply: updated.messages.find(m => m.senderType === "AI")?.message }, null, 2));
} finally { await prisma.$disconnect(); }
