import { assertHandoffContact } from "./chat-agent.contact";
import { Resend } from "resend";
import { prisma } from "../config/prisma";
import { getProductDetails, searchAgentProducts } from "./product.service";
import { notifyAdminsOfChatMessage } from "./admin-push.service";
import { AGENT_SENDER_ID, ASMAA_EMAIL, DEV_HANDOFF_EMAIL, contactPath, decideChatTurn, chatAgentEnabled, type AgentContext, type AgentDecision, type CatalogProduct } from "./chat-agent.policy";
import { approveAdvisorTransfer } from "./chat-agent.transfer-consent";
import { respondWithChatAgent } from "./chat-agent.openai";

export { chatAgentEnabled } from "./chat-agent.policy";
const category: Record<string, string> = { VILLA: "villas", TRANSPORTATION: "transportation", SWIMMINGPOOL: "beachclubs", NIGHTCLUB: "nightclubs", ACTIVITY: "experiences", RESTAURANT: "restaurants" };
export type WorkerDependencies = { authorizeTransfer?: typeof approveAdvisorTransfer; respond?: typeof respondWithChatAgent; sendEmail?: (job: any) => Promise<string> };
export function recommendationMemory(rows: Array<{ recommendations: unknown }>) {
  const products = new Map<string, { type: string; uniqueCode: string; title: string }>();
  for (const row of rows) for (const card of Array.isArray(row.recommendations) ? row.recommendations : []) {
    if (typeof card?.type !== "string" || typeof card?.uniqueCode !== "string") continue;
    products.set(`${card.type}:${card.uniqueCode}`, { type: card.type, uniqueCode: card.uniqueCode, title: String(card.title || card.uniqueCode) });
  }
  return [...products.values()];
}
export function agentHistoryMessage(row: any) {
  const assistant = ["AI", "ADVISOR"].includes(row.senderType);
  const cards = assistant && Array.isArray(row.recommendations) ? row.recommendations.map((p: any) => ({ product_type: p.type, unique_code: p.uniqueCode, title: p.title, plan: p.planTitle, displayedPriceEuro: p.priceEuro })) : [];
  return { role: (assistant ? "assistant" : "user") as "assistant" | "user", content: row.message + (cards.length ? `\nPreviously shown products, in display order (look up current details before answering): ${JSON.stringify(cards)}` : "") };
}
export function publicAgentProduct(product: any, language: string): CatalogProduct {
  return { id: product.id, type: product.type, uniqueCode: product.uniqueCode, title: product.title, subtitle: product.subtitle,
    thumbnail: product.thumbnail, images: Array.from({ length: 50 }, (_, i) => product[`image${i + 1}`]).filter(Boolean),
    description: product.description?.slice(0, 6000), address: product.address, priceEuro: product.priceEuro,
    priceWithDriverEuro: product.priceWithDriverEuro, priceWithDriverLabel: product.priceWithDriverLabel,
    currency: "EUR", priceTitle: product.priceTitle, tags: product.tags, details: product.details,
    plans: product.plans, url: `${language === "en" ? "" : `/${language}`}/${category[product.type]}/${encodeURIComponent(product.uniqueCode)}` };
}
export async function queueChatAgentTurn(tx: any, chatId: string, inputMessageId: string) {
  const existing = await tx.chatAgentTask.findUnique({ where: { inputMessageId } });
  if (existing) return existing;
  const pending = await tx.chatAgentTask.count({ where: { chatId, status: { in: ["QUEUED", "RUNNING"] } } });
  if (pending >= 8) throw Object.assign(new Error("Please wait for the concierge to answer before sending more messages"), { status: 429 });
  return tx.chatAgentTask.upsert({ where: { inputMessageId }, create: { chatId, inputMessageId }, update: {} });
}
async function claimTask(id: string) {
  return prisma.$transaction(async tx => {
    const task = await tx.chatAgentTask.findUnique({ where: { id } });
    if (!task || task.status !== "QUEUED" || task.attempts >= 3) return null;
    const locks = await tx.$queryRaw<Array<{ locked: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtextextended(${`chat-agent:${task.chatId}`}, 0)) AS locked`;
    if (!locks[0]?.locked) return null;
    const chat = await tx.chat.findUnique({ where: { id: task.chatId } });
    if (!chat || chat.managedBy !== "AI" || chat.status === "CLOSED") {
      await tx.chatAgentTask.update({ where: { id }, data: { status: "SKIPPED", completedAt: new Date() } }); return null;
    }
    if (await tx.chatAgentTask.findFirst({ where: { chatId: task.chatId, status: "RUNNING" } })) return null;
    const first = await tx.chatAgentTask.findFirst({ where: { chatId: task.chatId, status: "QUEUED" }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    if (first?.id !== id) return null;
    const lockedAt = new Date();
    const claimed = await tx.chatAgentTask.updateMany({ where: { id, status: "QUEUED" }, data: { status: "RUNNING", attempts: { increment: 1 }, lockedAt } });
    if (!claimed.count) return null;
    await tx.chat.update({ where: { id: chat.id }, data: { advisorTypingUntil: new Date(Date.now() + 360000) } });
    return { ...task, lockedAt, attempts: task.attempts + 1 };
  });
}
async function contextForTask(task: any) {
  const chat = await prisma.chat.findUniqueOrThrow({ where: { id: task.chatId }, include: { individual: true, lead: true, prospect: true, account: true } });
  const incoming = await prisma.chatMessage.findUniqueOrThrow({ where: { id: task.inputMessageId } });
  const visitor = chat.visitorId ? await prisma.visitor.findUnique({ where: { id: chat.visitorId } }) : null;
  const person: any = chat.individual || chat.account || chat.prospect || chat.lead || visitor || {};
  const shown = await prisma.chatMessage.findMany({ where: { chatId: chat.id, senderType: "AI" }, select: { recommendations: true }, orderBy: { sendTime: "asc" } });
  const rows = await prisma.chatMessage.findMany({ where: { chatId: chat.id, id: { not: incoming.id }, OR: [{ sendTime: { lt: incoming.sendTime } }, { senderType: { in: ["AI", "ADVISOR"] } }] }, orderBy: [{ sendTime: "desc" }, { id: "desc" }], take: 31 });
  const context: AgentContext = { language: chat.language, previouslyShown: recommendationMemory(shown), profile: { firstName: person.firstName, lastName: person.lastName,
    email: person.email || person.manualEmail, phone: person.mobilePhone || person.phone },
    history: [...rows.reverse().map(agentHistoryMessage), { role: "user", content: incoming.message }] };
  return { chat, context };
}
function emailText(chat: any, context: AgentContext, decision: AgentDecision, requestId: string) {
  const handoff = decision.handoff!;
  const adminUrl = (process.env.ADMIN_URL || "http://localhost:8080").replace(/\/$/, "");
  return [`A website visitor/client is asking Asmaa Mounadi about ${handoff.reason === "availability" ? "product availability or a booking" : "published pricing and negotiation"}.`,
    `Summary: ${handoff.summary}`, `Client: ${[handoff.firstName, handoff.lastName].filter(Boolean).join(" ") || "Website visitor"}`,
    `Email: ${handoff.email || "Not provided; reply in the chat"}`, `Phone: ${handoff.phone || "Not provided"}`,
    `Individual: ${chat.individualId || "Anonymous visitor"}`, `Visitor: ${chat.visitorId || "Unknown"}`,
    `Products: ${handoff.products.length ? handoff.products.map(p => `${p.title} (${p.uniqueCode})`).join(", ") : "General request; see conversation"}`,
    `Language: ${chat.language}`, `Contact request: ${requestId}`, `Open chat: ${adminUrl}/chats/${chat.id}`,
    "The client explicitly agreed to transfer this conversation to Asmaa.",
    "Availability and any price exception must be reviewed by Asmaa; the agent did not confirm either.", "Recent conversation:",
    ...context.history.slice(-16).map(message => `${message.role === "user" ? "Client" : "Concierge"}: ${message.content}`)].join("\n\n");
}
export async function completeChatAgentTask(task: any, context: AgentContext, decision: AgentDecision) {
  if (decision.handoff && decision.handoff.consentConfirmed !== true) throw new Error("Advisor transfer requires confirmed client consent");
  if (decision.handoff) assertHandoffContact(decision.handoff);
  const advisor = decision.handoff ? await prisma.user.findFirst({ where: { email: { equals: ASMAA_EMAIL, mode: "insensitive" }, isActive: true }, select: { id: true } }) : null;
  if (decision.handoff && !advisor) throw new Error("Asmaa's active advisor account is not configured");
  return prisma.$transaction(async tx => {
    // Ownership and task lease are checked again at commit, preventing late AI
    // responses after an administrator takes over or a worker lease is replaced.
    const current = await tx.chatAgentTask.findUnique({ where: { id: task.id } });
    if (!current || current.status !== "RUNNING" || current.lockedAt?.getTime() !== task.lockedAt.getTime()) return null;
    if (decision.handoff) {
      const latestClientMessage = await tx.chatMessage.findFirst({
        where: { chatId: task.chatId, senderType: { notIn: ["AI", "ADVISOR"] } },
        orderBy: [{ sendTime: "desc" }, { id: "desc" }], select: { id: true },
      });
      if (latestClientMessage?.id !== current.inputMessageId) {
        // A newer question/cancellation supersedes consent while the model runs.
        await tx.chatAgentTask.update({ where: { id: task.id }, data: { status: "SKIPPED", completedAt: new Date() } });
        return null;
      }
    }
    const changed = await tx.chat.updateMany({ where: { id: task.chatId, managedBy: "AI", status: { not: "CLOSED" } }, data: {
      managedBy: decision.handoff ? "MANUAL" : "AI", advisorId: advisor?.id || null,
      status: decision.handoff ? "WAITING_FOR_ADVISOR" : "WAITING_FOR_VISITOR", advisorTypingUntil: null,
    } });
    if (!changed.count) { await tx.chatAgentTask.update({ where: { id: task.id }, data: { status: "SKIPPED", completedAt: new Date() } }); return null; }
    const chat = await tx.chat.findUniqueOrThrow({ where: { id: task.chatId } });
    let handoffId: string | null = null;
    if (decision.handoff) {
      const h = decision.handoff;
      const request = await tx.contactRequest.create({ data: {
        firstName: h.firstName || "Website visitor", lastName: h.lastName || "", email: h.email || "", mobilePhone: h.phone,
        requestType: "PRODUCT_REQUEST", subject: `Chat ${h.reason === "availability" ? "availability request" : "pricing discussion"}`,
        comment: `${h.summary}\nChat: ${chat.id}\nProducts: ${h.products.map(p => `${p.title} (${p.uniqueCode})`).join(", ") || "General request"}`,
        visitorId: chat.visitorId, individualId: chat.individualId, leadId: chat.leadId, prospectId: chat.prospectId, accountId: chat.accountId,
        requesterStage: chat.participantStage, createdBy: AGENT_SENDER_ID,
      } });
      const outbox = await tx.chatAgentHandoff.create({ data: { chatId: chat.id, contactRequestId: request.id, reason: h.reason,
        recipient: DEV_HANDOFF_EMAIL, emailBody: emailText(chat, context, decision, request.id) } });
      handoffId = outbox.id;
    }
    const reply = await tx.chatMessage.create({ data: { chatId: chat.id, senderType: "AI", senderId: AGENT_SENDER_ID, message: decision.message, ...(decision.recommendations?.length ? { recommendations: decision.recommendations } : {}) } });
    await tx.chatAgentTask.update({ where: { id: task.id }, data: { status: "COMPLETED", completedAt: new Date(), responseMessageId: reply.id, lastError: null } });
    return { reply, handoffId, chat };
  });
}
export async function processChatAgentTask(id: string, dependencies: WorkerDependencies = {}) {
  if (!chatAgentEnabled()) return false;
  const task = await claimTask(id); if (!task) return false;
  try {
    const { chat, context } = await contextForTask(task);
    const decision = await decideChatTurn(context, {
      respond: dependencies.respond || respondWithChatAgent,
      authorizeTransfer: dependencies.authorizeTransfer || approveAdvisorTransfer,
      search: async (query, type, language, excluded) => (await searchAgentProducts(query, type, language, excluded)).map(p => publicAgentProduct(p, language)),
      product: async (type, code, language) => { const p = await getProductDetails(code, language, type); return p ? publicAgentProduct(p, language) : null; },
    });
    const result = await completeChatAgentTask(task, context, decision);
    if (result?.handoffId) {
      void notifyAdminsOfChatMessage({ chatId: chat.id, participantName: [context.profile.firstName, context.profile.lastName].filter(Boolean).join(" ") || "Website visitor", message: decision.handoff!.summary }).catch(() => {});
      await sendPendingHandoff(result.handoffId, dependencies.sendEmail);
    }
    return true;
  } catch (error) {
    const lastError = (error instanceof Error ? error.message : "Agent error").slice(0, 500);
    await prisma.$transaction(async tx => {
      const changed = await tx.chatAgentTask.updateMany({ where: { id, status: "RUNNING", lockedAt: task.lockedAt }, data: { status: task.attempts < 3 ? "QUEUED" : "FAILED", lastError, completedAt: task.attempts >= 3 ? new Date() : null } });
      if (!changed.count) return;
      const stillAgent = await tx.chat.updateMany({ where: { id: task.chatId, managedBy: "AI", status: { not: "CLOSED" } }, data: { advisorTypingUntil: null } });
      if (task.attempts >= 3 && stillAgent.count) {
        const chat = await tx.chat.findUniqueOrThrow({ where: { id: task.chatId } });
        const failures: Record<string, string> = {
          en: "I’m temporarily unable to answer. Please try again or use our", fr: "Je ne peux pas répondre pour le moment. Réessayez ou contactez notre équipe ici :",
          de: "Ich kann gerade nicht antworten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns hier:", es: "No puedo responder en este momento. Inténtalo de nuevo o contacta con nuestro equipo aquí:",
          it: "Al momento non riesco a rispondere. Riprova o contatta il nostro team qui:", pt: "Não consigo responder de momento. Tente novamente ou contacte a nossa equipa aqui:",
        };
        await tx.chatMessage.create({ data: { chatId: task.chatId, senderType: "AI", senderId: AGENT_SENDER_ID, message: `${failures[chat.language] || failures.en} [Contact](${contactPath(chat.language)}).` } });
      }
    });
    console.error("Chat agent turn failed", { taskId: id, message: lastError });
    return false;
  }
}
export async function sendHandoffEmail(job: any) {
  if (!chatAgentEnabled()) throw new Error("The chat agent is disabled in this environment");
  if (job.recipient !== DEV_HANDOFF_EMAIL) throw new Error("Development and preproduction handoffs can only email the authorized test recipient");
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.RESEND_FROM_EMAIL || "Moorish Concierge <contact@moorishconcierge.com>",
    to: [DEV_HANDOFF_EMAIL], subject: `${process.env.NODE_ENV === "test" ? "[TEST]" : "[DEV]"} Concierge chat: ${job.reason === "availability" ? "availability request" : "pricing discussion"} for Asmaa`, text: job.emailBody,
  }, { idempotencyKey: `chat-agent-handoff/${job.id}` });
  if (result.error || !result.data?.id) throw new Error(result.error?.message || "Email was not accepted");
  return result.data.id;
}
export async function sendPendingHandoff(id: string, sender = sendHandoffEmail) {
  const now = new Date();
  const claimed = await prisma.chatAgentHandoff.updateMany({ where: { id, status: "PENDING", nextAttemptAt: { lte: now }, attempts: { lt: 5 } }, data: { status: "SENDING", lockedAt: now, attempts: { increment: 1 } } });
  if (!claimed.count) return false;
  const job = await prisma.chatAgentHandoff.findUniqueOrThrow({ where: { id } });
  try {
    const resendEmailId = await sender(job);
    await prisma.chatAgentHandoff.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), resendEmailId, lastError: null } });
    return true;
  } catch (error) {
    await prisma.chatAgentHandoff.update({ where: { id }, data: { status: job.attempts >= 5 ? "FAILED" : "PENDING", nextAttemptAt: new Date(Date.now() + 60000 * job.attempts), lastError: (error as Error).message.slice(0, 500) } });
    return false;
  }
}
let workerBusy = false;
export async function runChatAgentWorker() {
  if (!chatAgentEnabled() || workerBusy) return;
  workerBusy = true;
  try {
    const expired = new Date(Date.now() - 360000);
    // An interrupted request never committed a reply or handoff. Restore its
    // attempt so even an interrupted third attempt can be retried after restart.
    await prisma.chatAgentTask.updateMany({ where: { status: "RUNNING", lockedAt: { lt: expired } }, data: { status: "QUEUED", attempts: { decrement: 1 } } });
    await prisma.chatAgentHandoff.updateMany({ where: { status: "SENDING", lockedAt: { lt: expired } }, data: { status: "PENDING" } });
    const tasks = await prisma.chatAgentTask.findMany({ where: { status: "QUEUED", attempts: { lt: 3 } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 6 });
    // Separate chats can progress together; the per-chat DB claim preserves order.
    await Promise.all(tasks.map(task => processChatAgentTask(task.id)));
    const emails = await prisma.chatAgentHandoff.findMany({ where: { status: "PENDING", attempts: { lt: 5 }, nextAttemptAt: { lte: new Date() } }, take: 10 });
    await Promise.all(emails.map(job => sendPendingHandoff(job.id)));
  } finally { workerBusy = false; }
}
export function startChatAgentWorker() {
  if (!chatAgentEnabled()) {
    if (!process.env.OPENAI_API_KEY) console.warn("Cécile is disabled: OPENAI_API_KEY is missing from website-api configuration.");
    else console.info("Cécile is disabled for this environment/database configuration; manual advisor chats remain enabled.", { environment: process.env.NODE_ENV || "local" });
    return;
  }
  const tick = () => void runChatAgentWorker().catch(error => console.error("Chat agent worker failed", error.message));
  const timer = setInterval(tick, 2500); timer.unref(); tick();
  console.log("Chat agent enabled for local/development/preproduction; handoff emails go to the authorized test address.");
}
