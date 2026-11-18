import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/config/prisma";
import { decideChatTurn } from "../src/services/chat-agent.policy";
import { respondWithChatAgent } from "../src/services/chat-agent.openai";
import { publicAgentProduct } from "../src/services/chat-agent.service";
import { getProductDetails, searchAgentProducts } from "../src/services/product.service";

test("Cécile answers from the enriched existing local products", { skip: process.env.RUN_CHAT_AGENT_LIVE_TESTS !== "1", timeout: 180000 }, async t => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  const dependencies = {
    respond: respondWithChatAgent,
    search: async (query: string, type: string | null, language: string) => (await searchAgentProducts(query, type, language)).map(p => publicAgentProduct(p, language)),
    product: async (type: string, code: string, language: string) => { const p = await getProductDetails(code, language, type); return p ? publicAgentProduct(p, language) : null; },
  };
  const scenarios = [
    { title: "confirmed villa capacity and unchanged driver pricing", language: "en", prompt: "For Villa Atlas View (villa-atlas-view), how many guests can stay, and what are the prices without and with the private driver?", matches: [/12|twelve/i, /850/, /950/], absent: [/15 guests|fifteen guests/i] },
    { title: "cleaned evening transport option and exact duration", language: "en", prompt: "For Range Rover Chauffeur (range-rover-chauffeur), what is included in the evening city service, how long is it, and what is the published price?", matches: [/75/, /4|four|240/i, /water/i], absent: [/okok|driver xx|Villa luxury/i] },
    { title: "representative VIP inclusions on the original existing plan", language: "en", prompt: "At Agafay Pool Retreat (agafay-pool-retreat), what does the adult VIP Experience cost and include? Does it include return transfers and lunch?", matches: [/345/, /lunch/i, /transfer/i, /sunbed|lounger/i], absent: [] },
    { title: "French comparison of existing pool plans", language: "fr", prompt: "Au Beldi Country Club (beldi-country-club), quels sont les prix de l’accès piscine, piscine et déjeuner, et cabana privée ? Le déjeuner est-il inclus dans l’accès simple ?", matches: [/45/, /75/, /180/, /déjeuner/i], absent: [] },
  ];
  try {
    for (const scenario of scenarios) await t.test(scenario.title, async () => {
      const result = await decideChatTurn({ language: scenario.language, profile: {}, history: [{ role: "user", content: scenario.prompt }] }, dependencies);
      assert.equal(result.handoff, undefined, "Product questions should stay with Cécile");
      for (const pattern of scenario.matches) assert.match(result.message, pattern);
      for (const pattern of scenario.absent) assert.doesNotMatch(result.message, pattern);
      console.log(`${scenario.title}: ${result.message}`);
    });
  } finally { await prisma.$disconnect(); }
});
