import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import { prisma } from "../src/config/prisma";
import routes from "../src/routes/chat.routes";
import { queueChatAgentTurn, processChatAgentTask, sendPendingHandoff, sendHandoffEmail, completeChatAgentTask } from "../src/services/chat-agent.service";
import { productRecommendation } from "../src/services/chat-agent.recommendations";
import { ASMAA_EMAIL, DEV_HANDOFF_EMAIL } from "../src/services/chat-agent.policy";

const reply = (message = "Hello, I am the AI concierge.") => ({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ message, price_quotes: [] }) }] }] });
const handoff = { output: [{ type: "function_call", name: "handoff_to_advisor", call_id: "handoff", arguments: JSON.stringify({ reason: "availability", summary: "Client requests availability for next weekend", products: [], first_name: "Clara", last_name: "Martin", email: "clara@example.invalid", phone: null }) }] };

test("chat agent persistence, ownership, retries and HTTP identity boundaries", { skip: process.env.RUN_LOCAL_DB_TESTS !== "1" }, async t => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  process.env.NODE_ENV = "local"; process.env.OPENAI_API_KEY ||= "mocked";
  const advisor = await prisma.user.findFirst({ where: { email: { equals: ASMAA_EMAIL, mode: "insensitive" }, isActive: true } });
  assert.ok(advisor, "Local Asmaa advisor account is required");
  const chats: string[] = [], requests: string[] = [];
  const visitorId = `qa_agent_${randomUUID()}`, journeyId = `qa_agent_${randomUUID()}`;
  const app = express(); app.use(express.json()); app.use("/chats", routes);
  app.use((err: any, _req: any, res: any, _next: any) => res.status(err.status || 500).json({ message: err.message }));
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${(server.address() as any).port}/chats`;
  const headers = { "Content-Type": "application/json", "x-visitor-id": visitorId, "x-journey-id": journeyId };
  async function fixture() {
    const chat = await prisma.chat.create({ data: { managedBy: "AI", language: "en", messages: { create: { senderType: "VISITOR", message: "Yes, transfer this chat to Asmaa to check next weekend. My full name is Clara Martin and my email is clara@example.invalid." } } }, include: { messages: true } });
    chats.push(chat.id);
    const task = await queueChatAgentTurn(prisma, chat.id, chat.messages[0].id);
    return { chat, task };
  }
  try {
    await t.test("new HTTP conversations belong to AI and preserve journey access control", async () => {
      const response = await fetch(url, { method: "POST", headers, body: JSON.stringify({ message: "Hello", language: "fr" }) });
      assert.equal(response.status, 201, await response.clone().text());
      const { chat } = await response.json(); chats.push(chat.id);
      assert.equal(chat.managedBy, "AI"); assert.equal(chat.advisorId, null); assert.equal(chat.messages.length, 1);
      assert.equal(await prisma.chatAgentTask.count({ where: { chatId: chat.id } }), 1);
      assert.equal((await fetch(`${url}/${chat.id}`, { headers: { ...headers, "x-journey-id": randomUUID() } })).status, 404);
      assert.equal((await fetch(`${url}/${chat.id}/messages`, { method: "POST", headers, body: JSON.stringify({ message: "Tell me about your villas" }) })).status, 201);
      assert.equal(await prisma.chatAgentTask.count({ where: { chatId: chat.id } }), 2);
    });
    await t.test("duplicate queue/worker execution creates exactly one AI reply", async () => {
      const { chat, task } = await fixture();
      assert.equal((await queueChatAgentTurn(prisma, chat.id, chat.messages[0].id)).id, task.id);
      let calls = 0;
      const mock = { respond: async () => { calls++; return reply(); } };
      await Promise.all([processChatAgentTask(task.id, mock), processChatAgentTask(task.id, mock)]);
      assert.equal(calls, 1); assert.equal(await prisma.chatMessage.count({ where: { chatId: chat.id, senderType: "AI" } }), 1);
      assert.equal((await prisma.chatAgentTask.findUniqueOrThrow({ where: { id: task.id } })).status, "COMPLETED");
    });
    await t.test("recommendation cards survive persistence and authenticated journey reload", async () => {
      const { chat, task } = await fixture();
      await prisma.chat.update({ where: { id: chat.id }, data: { visitorId, journeyId } });
      const lease = await prisma.chatAgentTask.update({ where: { id: task.id }, data: { status: "RUNNING", lockedAt: new Date() } });
      const card = productRecommendation({ id: "fixture-villa", type: "VILLA", uniqueCode: "fixture-villa", title: "Fixture villa", priceEuro: 600, thumbnail: "https://images.example/villa.jpg" }, null, "fr");
      const completed = await completeChatAgentTask(lease, { language: "fr", profile: {}, history: [] }, { message: "Voici une suggestion.", contactRedirect: false, recommendations: [card] });
      assert.ok(completed);
      const response = await fetch(`${url}/${chat.id}`, { headers }); assert.equal(response.status, 200);
      const body = await response.json();
      assert.deepEqual(body.chat.messages.find((m: any) => m.id === completed.reply.id).recommendations, [card]);
      assert.equal((await fetch(`${url}/${chat.id}`, { headers: { ...headers, "x-journey-id": randomUUID() } })).status, 404);
    });
    await t.test("availability creates a related contact request, assigns Asmaa and retries email without duplication", async () => {
      const { chat, task } = await fixture(); const outputs = [handoff, reply("Asmaa will follow up here.")];
      await processChatAgentTask(task.id, { respond: async () => outputs.shift(), authorizeTransfer: async () => true, sendEmail: async () => { throw new Error("Mock Resend outage"); } });
      const updated = await prisma.chat.findUniqueOrThrow({ where: { id: chat.id } });
      assert.equal(updated.managedBy, "MANUAL"); assert.equal(updated.advisorId, advisor.id);
      const job = await prisma.chatAgentHandoff.findUniqueOrThrow({ where: { chatId: chat.id } });
      requests.push(job.contactRequestId!);
      assert.equal(job.recipient, DEV_HANDOFF_EMAIL); assert.equal(job.status, "PENDING"); assert.equal(job.attempts, 1);
      assert.match(job.emailBody, /next weekend/); assert.match(job.emailBody, new RegExp(chat.id));
      const contact = await prisma.contactRequest.findUniqueOrThrow({ where: { id: job.contactRequestId! } });
      assert.equal(contact.requestType, "PRODUCT_REQUEST"); assert.equal(contact.email, "clara@example.invalid");
      await prisma.chatAgentHandoff.update({ where: { id: job.id }, data: { nextAttemptAt: new Date(0) } });
      let delivered = 0;
      assert.equal(await sendPendingHandoff(job.id, async () => { delivered++; return "mock-email-id"; }), true);
      assert.equal(await sendPendingHandoff(job.id, async () => { delivered++; return "duplicate"; }), false);
      assert.equal(delivered, 1); assert.equal((await prisma.chatAgentHandoff.findUniqueOrThrow({ where: { id: job.id } })).status, "SENT");
      assert.equal(await processChatAgentTask(task.id), false);
      const incoming = await prisma.chatMessage.create({ data: { chatId: chat.id, senderType: "VISITOR", message: "Thank you" } });
      const later = await queueChatAgentTurn(prisma, chat.id, incoming.id);
      assert.equal(await processChatAgentTask(later.id), false);
    });
    await t.test("human takeover during generation prevents late AI reply and email", async () => {
      const { chat, task } = await fixture(); let sent = false;
      const outputs = [handoff, reply("Asmaa will follow up here.")];
      await processChatAgentTask(task.id, { respond: async () => {
        await prisma.chat.update({ where: { id: chat.id }, data: { managedBy: "MANUAL", advisorId: advisor.id } });
        return outputs.shift();
      }, authorizeTransfer: async () => true, sendEmail: async () => { sent = true; return "unexpected"; } });
      assert.equal(sent, false); assert.equal(await prisma.chatAgentHandoff.count({ where: { chatId: chat.id } }), 0);
      assert.equal(await prisma.chatMessage.count({ where: { chatId: chat.id, senderType: "AI" } }), 0);
      assert.equal((await prisma.chatAgentTask.findUniqueOrThrow({ where: { id: task.id } })).status, "SKIPPED");
    });
    await t.test("bounded model failure has a visible localized fallback, never a fake handoff", async () => {
      const { chat, task } = await fixture();
      await prisma.chat.update({ where: { id: chat.id }, data: { language: "fr" } });
      const fail = { respond: async () => { throw new Error("Mock model unavailable"); } };
      for (let i = 0; i < 3; i++) await processChatAgentTask(task.id, fail);
      assert.equal((await prisma.chatAgentTask.findUniqueOrThrow({ where: { id: task.id } })).status, "FAILED");
      const message = await prisma.chatMessage.findFirstOrThrow({ where: { chatId: chat.id, senderType: "AI" } });
      assert.match(message.message, /\/fr\/contact/); assert.equal(await prisma.chatAgentHandoff.count({ where: { chatId: chat.id } }), 0);
    });
    await t.test("the real email sender refuses Asmaa's address during development", async () => {
      await assert.rejects(sendHandoffEmail({ recipient: ASMAA_EMAIL }), /authorized.*recipient/);
    });
    await t.test("production creates an AI-owned conversation and queues the first agent turn", async () => {
      process.env.NODE_ENV = "production";
      try {
        const response = await fetch(url, { method: "POST", headers, body: JSON.stringify({ message: "Hello" }) });
        assert.equal(response.status, 201, await response.clone().text());
        const { chat } = await response.json(); chats.push(chat.id);
        assert.equal(chat.managedBy, "AI"); assert.equal(chat.advisorId, null);
        assert.equal(await prisma.chatAgentTask.count({ where: { chatId: chat.id } }), 1);
      } finally { process.env.NODE_ENV = "local"; }
    });
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await prisma.chat.deleteMany({ where: { id: { in: chats } } });
    await prisma.contactRequest.deleteMany({ where: { id: { in: requests } } });
    await prisma.interaction.deleteMany({ where: { visitorId } });
    await prisma.visitorJourney.deleteMany({ where: { visitorId } });
    await prisma.visitor.deleteMany({ where: { id: visitorId } });
    await prisma.$disconnect();
  }
});
