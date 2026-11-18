import { approveAdvisorTransfer } from "../src/services/chat-agent.transfer-consent";
import assert from "node:assert/strict";
import test from "node:test";
import { decideChatTurn, type AgentContext } from "../src/services/chat-agent.policy";
import { respondWithChatAgent } from "../src/services/chat-agent.openai";
import { prisma } from "../src/config/prisma";
import { getProductDetails, searchAgentProducts } from "../src/services/product.service";
import { publicAgentProduct } from "../src/services/chat-agent.service";

// Explicit opt-in: uses the real OpenAI key and public local catalog, but never
// writes a conversation, creates a contact request, or sends an email.
test("live model understands product, availability, negotiation and contact intents", { skip: process.env.RUN_CHAT_AGENT_LIVE_TESTS !== "1", timeout: 240000 }, async t => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  const products = await searchAgentProducts("", "VILLA", "en");
  const villa = products.find(p => Number(p.priceEuro) > 0); assert.ok(villa, "A priced local villa is required");
  assert.ok((await searchAgentProducts(`${villa.title} ${villa.uniqueCode}`, "VILLA", "en")).some(p => p.id === villa.id), "Combined product name and code must be searchable");
  const dependencies = { respond: respondWithChatAgent, authorizeTransfer: approveAdvisorTransfer,
    search: async (query: string, type: string | null, language: string) => (await searchAgentProducts(query, type, language)).map(p => publicAgentProduct(p, language)),
    product: async (type: string, code: string, language: string) => { const p = await getProductDetails(code, language, type); return p ? publicAgentProduct(p, language) : null; },
  };
  const context = (message: string, language = "en", previous: AgentContext["history"] = []): AgentContext => ({ language, profile: {}, history: [...previous, { role: "user", content: message }] });
  try {
    await t.test("published villa price comes from real retrieval", async () => {
      const result = await decideChatTurn(context(`What is the published daily price of ${villa.title} (${villa.uniqueCode})?`), dependencies);
      assert.equal(result.handoff, undefined); assert.ok(result.message.includes(String(villa.priceEuro)), result.message);
      assert.match(result.message, /Cécile/);
      console.log("LIVE price:", result.message);
    });
    await t.test("availability is offered to Asmaa and transfers only after consent", async () => {
      const result = await decideChatTurn(context(`Development QA. Please check availability of ${villa.title} (${villa.uniqueCode}) for 6 people on 20-22 December. Do not confirm a booking.`), dependencies);
      assert.equal(result.handoff, undefined); assert.match(result.message, /Asmaa/);
      const agreed = await decideChatTurn(context("Yes, transfer this chat to Asmaa. My full name is Clara Martin and my email is clara.martin.qa.20261118@gmail.com.", "en", [
        { role: "user", content: "Please check availability of " + villa.title + " (" + villa.uniqueCode + ") for 6 people on 20-22 December." },
        { role: "assistant", content: result.message },
      ]), dependencies);
      assert.equal(agreed.handoff?.reason, "availability"); assert.equal(agreed.handoff.products[0].id, villa.id);
      console.log("LIVE availability:", result.message);
    });
    await t.test("insistent negotiation is transferred without changing published prices", async () => {
      const result = await decideChatTurn(context("Still too expensive. I insist on a lower price. Can you make it cheaper?", "en", [
        { role: "user", content: `How much is ${villa.title} (${villa.uniqueCode})?` },
        { role: "assistant", content: `I'm Cécile, the AI Assistant. The published daily rate is ${villa.priceEuro} EUR. We follow published pricing.` },
      ]), dependencies);
      assert.equal(result.handoff, undefined);
      const agreed = await decideChatTurn(context("Yes, transfer this chat to Asmaa now. My full name is Clara Martin and my email is clara.martin.qa.20261118@gmail.com.", "en", [
        { role: "user", content: "I insist on a lower price for " + villa.title + " (" + villa.uniqueCode + ")." },
        { role: "assistant", content: result.message },
      ]), dependencies);
      assert.equal(agreed.handoff?.reason, "pricing_negotiation"); assert.doesNotMatch(result.message, /Cécile|AI (?:assistant|concierge)/i); console.log("LIVE negotiation:", result.message);
    });
    await t.test("French support directs to clickable Contact without transferring ownership", async () => {
      const result = await decideChatTurn(context("Je souhaite déposer une réclamation concernant votre service.", "fr"), dependencies);
      assert.equal(result.contactRedirect, true); assert.equal(result.handoff, undefined); assert.match(result.message, /\/fr\/contact/);
      console.log("LIVE complaint:", result.message);
    });
    await t.test("transportation prices and inclusions are retrieved from active plans", async () => {
      const transport = (await searchAgentProducts("", "TRANSPORTATION", "en"))[0]; assert.ok(transport);
      const details = await getProductDetails(transport.uniqueCode, "en", "TRANSPORTATION");
      assert.ok(details && "plans" in details && Array.isArray(details.plans) && details.plans.length);
      const result = await decideChatTurn(context(`What are the service options, inclusions and exact published prices for ${transport.title} (${transport.uniqueCode})?`), dependencies);
      assert.equal(result.handoff, undefined);
      assert.ok(details.plans.some((p: any) => result.message.includes(String(p.salePrice))), result.message);
      console.log("LIVE plans:", result.message);
    });
  } finally { await prisma.$disconnect(); }
});
