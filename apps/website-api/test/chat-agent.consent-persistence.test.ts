import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/config/prisma";
import { completeChatAgentTask } from "../src/services/chat-agent.service";
import type { AgentContext } from "../src/services/chat-agent.policy";

test("unconfirmed availability stays AI-owned without contact requests or email jobs", { skip: process.env.RUN_LOCAL_DB_TESTS !== "1" }, async () => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  const chat = await prisma.chat.create({ data: { managedBy: "AI", language: "fr", messages: { create: { senderType: "VISITOR", message: "Est-elle disponible du 18 au 28 novembre ?" } } }, include: { messages: true } });
  const context: AgentContext = { language: "fr", profile: {}, history: [{ role: "user", content: chat.messages[0].message }] };
  try {
    // A running lease is invisible to the development worker's queued-task scan.
    const lease = await prisma.chatAgentTask.create({ data: { chatId: chat.id, inputMessageId: chat.messages[0].id, status: "RUNNING", attempts: 1, lockedAt: new Date() } });
    await assert.rejects(completeChatAgentTask(lease, context, {
      message: "Transferring", contactRedirect: false,
      handoff: { reason: "availability", summary: "Unconfirmed", products: [], firstName: null, lastName: null, email: null, phone: null } as any,
    }), /confirmed client consent/);
    await assert.rejects(completeChatAgentTask(lease, context, {
      message: "Transferring", contactRedirect: false,
      handoff: { reason: "availability", consentConfirmed: true, summary: "Missing contact", products: [], firstName: null, lastName: null, email: null, phone: null },
    }), /full name/);
    assert.equal((await prisma.chat.findUniqueOrThrow({ where: { id: chat.id } })).managedBy, "AI");
    const result = await completeChatAgentTask(lease, context, { message: "Asmaa est notre conseillère en disponibilités. Souhaitez-vous lui transférer cette conversation ?", contactRedirect: false });
    assert.ok(result);
    assert.equal(result.chat.managedBy, "AI");
    assert.equal(result.chat.advisorId, null);
    assert.equal(result.handoffId, null);
    assert.equal(await prisma.chatAgentHandoff.count({ where: { chatId: chat.id } }), 0);
    assert.equal(await prisma.contactRequest.count({ where: { comment: { contains: chat.id } } }), 0);

    const question = await prisma.chatMessage.create({ data: { chatId: chat.id, senderType: "VISITOR", message: "Pas encore, dites-moi si la piscine est privée." } });
    const followup = await prisma.chatAgentTask.create({ data: { chatId: chat.id, inputMessageId: question.id, status: "RUNNING", attempts: 1, lockedAt: new Date() } });
    await completeChatAgentTask(followup, { ...context, history: [...context.history, { role: "assistant", content: result.reply.message }, { role: "user", content: question.message }] }, { message: "Oui, Villa Azur dispose d’une piscine privée.", contactRedirect: false });
    assert.equal((await prisma.chat.findUniqueOrThrow({ where: { id: chat.id } })).managedBy, "AI");
    assert.equal(await prisma.chatAgentHandoff.count({ where: { chatId: chat.id } }), 0);
    assert.equal(await prisma.chatMessage.count({ where: { chatId: chat.id, senderType: "AI" } }), 2);
    const consent = await prisma.chatMessage.create({ data: { chatId: chat.id, senderType: "VISITOR", message: "Yes, transfer to Asmaa.", sendTime: new Date(Date.now() + 10) } });
    const staleLease = await prisma.chatAgentTask.create({ data: { chatId: chat.id, inputMessageId: consent.id, status: "RUNNING", attempts: 1, lockedAt: new Date() } });
    await prisma.chatMessage.create({ data: { chatId: chat.id, senderType: "VISITOR", message: "Wait, not yet. Tell me more about the pool first.", sendTime: new Date(Date.now() + 20) } });
    const skipped = await completeChatAgentTask(staleLease, context, { message: "Transferring", contactRedirect: false, handoff: { reason: "availability", consentConfirmed: true, summary: "Superseded consent", products: [], firstName: "Clara", lastName: "Martin", email: "clara@example.invalid", phone: null } });
    assert.equal(skipped, null);
    assert.equal((await prisma.chatAgentTask.findUniqueOrThrow({ where: { id: staleLease.id } })).status, "SKIPPED");
    assert.equal((await prisma.chat.findUniqueOrThrow({ where: { id: chat.id } })).managedBy, "AI");
    assert.equal(await prisma.chatAgentHandoff.count({ where: { chatId: chat.id } }), 0);

  } finally {
    await prisma.chat.delete({ where: { id: chat.id } });
    await prisma.$disconnect();
  }
});
