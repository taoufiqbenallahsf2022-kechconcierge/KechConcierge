import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/config/prisma";
import { decideChatTurn } from "../src/services/chat-agent.policy";
import { respondWithChatAgent } from "../src/services/chat-agent.openai";
import { publicAgentProduct } from "../src/services/chat-agent.service";
import { getProductDetails, searchAgentProducts } from "../src/services/product.service";

// Synthetic prompts and public QA catalog only. No chats, requests or emails.
test("Cécile understands the expanded development catalog", { skip: process.env.RUN_CHAT_AGENT_LIVE_TESTS !== "1", timeout: 240000 }, async t => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  const dependencies = {
    respond: respondWithChatAgent,
    search: async (query: string, type: string | null, language: string) => (await searchAgentProducts(query, type, language)).map(p => publicAgentProduct(p, language)),
    product: async (type: string, code: string, language: string) => { const p = await getProductDetails(code, language, type); return p ? publicAgentProduct(p, language) : null; },
  };
  const scenarios = [
    { name: "villa nightly rate, driver rate and seasonal heating", prompt: "For Villa Palm Serenity (qa-agent-villa-palm-serenity), what are the nightly prices with and without a driver? Is pool heating included in January and how many guests fit?", required: [/750/, /850/, /10/, /heat/i] },
    { name: "transportation capacity and exact airport-plan price", prompt: "For Family Van (qa-agent-family-van), what does the airport-to-Palmeraie option cost, how many passengers and bags fit, and is it one-way or return?", required: [/45/, /7|seven/i, /one.way/i] },
    { name: "beach club child pricing and lunch exclusion", prompt: "For Azure Family Club (qa-agent-azure-family-club), what is the pool-access price for a 7-year-old, does it include lunch, and must an adult accompany them?", required: [/25/, /lunch/i, /adult/i] },
    { name: "nightclub age restriction and entry pricing", prompt: "For Velvet Lounge (qa-agent-velvet-lounge), what is the minimum age and individual entry price? Does entry include drinks?", required: [/21/, /30/, /drink/i] },
    { name: "experience group rate and driving-licence restriction", prompt: "For Desert Buggy Trail (qa-agent-desert-buggy), what does one private two-seat buggy cost for two people? Is that per person or per group, and does its driver need a licence?", required: [/155/, /group|buggy/i, /licen[cs]e/i] },
    { name: "restaurant with no published price", prompt: "Does Chef’s Counter (qa-agent-chefs-counter) have a published starting price? Please tell me only what the catalog says, without estimating.", required: [/no (?:public|published)|not (?:publicly )?(?:listed|published)|doesn.t (?:have|list)|not have a published|no starting price/i] },
  ];
  try {
    for (const scenario of scenarios) await t.test(scenario.name, async () => {
      const result = await decideChatTurn({ language: "en", profile: {}, history: [{ role: "user", content: scenario.prompt }] }, dependencies);
      assert.equal(result.handoff, undefined, "A catalog question must not transfer ownership");
      for (const pattern of scenario.required) assert.match(result.message, pattern);
      console.log(`${scenario.name}: ${result.message}`);
    });
  } finally { await prisma.$disconnect(); }
});
