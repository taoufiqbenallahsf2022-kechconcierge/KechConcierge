import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/config/prisma";
import { decideChatTurn, type AgentContext } from "../src/services/chat-agent.policy";
import { respondWithChatAgent } from "../src/services/chat-agent.openai";
import { agentHistoryMessage, recommendationMemory, publicAgentProduct } from "../src/services/chat-agent.service";
import { getProductDetails, searchAgentProducts } from "../src/services/product.service";

test("live conversations provide fresh alternatives and a short service overview", { skip: process.env.RUN_CHAT_AGENT_LIVE_TESTS !== "1", timeout: 300000 }, async t => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  const dependencies = {
    respond: respondWithChatAgent,
    search: async (query: string, type: string | null, language: string, excluded: any[] = []) => (await searchAgentProducts(query, type, language, excluded)).map(p => publicAgentProduct(p, language)),
    product: async (type: string, code: string, language: string) => { const p = await getProductDetails(code, language, type); return p ? publicAgentProduct(p, language) : null; },
  };
  try {
    await t.test("searches can reach products beyond the first result page", async () => {
      const first = await searchAgentProducts("", "ACTIVITY", "en");
      assert.equal(first.length, 12);
      const excluded = first.map(p => ({ type: p.type, uniqueCode: p.uniqueCode, title: p.title }));
      const next = await searchAgentProducts("", "ACTIVITY", "en", excluded);
      assert.ok(next.length > 0); assert.ok(next.every(p => !excluded.some(old => old.uniqueCode === p.uniqueCode)));
      assert.ok(next.some(p => p.uniqueCode === "moroccan-kitchen-market-workshop"));
    });
    await t.test("repeated requests for alternatives never cycle to an earlier product", async () => {
      const context: AgentContext = { language: "en", profile: {}, history: [], previouslyShown: [] };
      const shown = new Set<string>(), rows: Array<{ recommendations: any }> = [];
      for (const prompt of [
        "Show me two varied Marrakech day experiences below 100 EUR per person. No extreme trekking. Just browsing, no date check.",
        "Other options please, different from those.",
        "Something else please, I have already seen those. Show me different activities.",
        "Any other choices that you haven't shown me yet?",
      ]) {
        context.history.push({ role: "user", content: prompt });
        const result = await decideChatTurn(context, dependencies);
        assert.equal(result.handoff, undefined);
        assert.ok(result.recommendations?.length, "There are enough different products to offer fresh suggestions");
        for (const p of result.recommendations) { const key = `${p.type}:${p.uniqueCode}`; assert.ok(!shown.has(key), `Repeated ${key}`); shown.add(key); }
        const row = { senderType: "AI", message: result.message, recommendations: result.recommendations };
        rows.push(row); context.history.push(agentHistoryMessage(row)); context.previouslyShown = recommendationMemory(rows);
        console.log("Fresh suggestions:", result.recommendations.map(p => p.title));
      }
      assert.ok(shown.size >= 6);
      context.history.push({ role: "user", content: "Can we go back to the very first option you showed me? Show that one again." });
      const revisit = await decideChatTurn(context, dependencies);
      assert.equal(revisit.recommendations?.[0]?.uniqueCode, rows[0].recommendations[0].uniqueCode);
    });
    for (const [language, message] of [["en", "What do you do?"], ["fr", "Vous proposez quoi comme services ?"]]) await t.test(`short company overview in ${language}`, async () => {
      let searches = 0;
      const result = await decideChatTurn({ language, profile: {}, history: [{ role: "user", content: message }] }, { ...dependencies, search: async (...args) => { searches++; return dependencies.search(...args); } });
      assert.equal(result.contactRedirect, false); assert.equal(result.handoff, undefined); assert.equal(result.recommendations?.length, 0); assert.equal(searches, 0);
      assert.ok(result.message.split(/\s+/).length <= 65); assert.match(result.message, /villa/i);
      console.log("Business overview:", result.message);
    });

  } finally { await prisma.$disconnect(); }
});


test("an exhausted experience catalog is acknowledged instead of recycled", { skip: process.env.RUN_CHAT_AGENT_LIVE_TESTS !== "1", timeout: 60000 }, async () => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  const dependencies = {
    respond: respondWithChatAgent, authorizeTransfer: approveAdvisorTransfer,
    search: async (query: string, type: string | null, language: string, excluded: any[] = []) => (await searchAgentProducts(query, type, language, excluded)).map(p => publicAgentProduct(p, language)),
    product: async (type: string, code: string, language: string) => { const p = await getProductDetails(code, language, type); return p ? publicAgentProduct(p, language) : null; },
  };
  try {
  const records = await prisma.activity.findMany({ where: { isActive: true }, select: { uniqueCode: true, titleEN: true } });
  const result = await decideChatTurn({ language: "en", profile: {}, previouslyShown: records.map(p => ({ type: "ACTIVITY", uniqueCode: p.uniqueCode, title: p.titleEN || p.uniqueCode })), history: [{ role: "assistant", content: "We have looked through the experience catalog together." }, { role: "user", content: "Any other experience products in your catalog that you haven't shown me yet? Please do not switch to other types of service." }] }, dependencies);
  assert.equal(result.recommendations?.length, 0); assert.equal(result.handoff, undefined);
  assert.match(result.message, /already|no (?:more|other|new)|all.*shown|don.t have.*(?:new|more)|no further|aren.t any|haven.t shown|haven.t.*(?:new|more)/i);
  console.log("Catalog exhausted:", result.message);
  } finally { await prisma.$disconnect(); }
});
