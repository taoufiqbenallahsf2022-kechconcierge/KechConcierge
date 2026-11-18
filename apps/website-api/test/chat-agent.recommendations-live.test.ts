import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/config/prisma";
import { decideChatTurn } from "../src/services/chat-agent.policy";
import { respondWithChatAgent } from "../src/services/chat-agent.openai";
import { publicAgentProduct } from "../src/services/chat-agent.service";
import { getProductDetails, searchAgentProducts } from "../src/services/product.service";

test("live visual recommendations use real products and selected plan prices", { skip: process.env.RUN_CHAT_AGENT_LIVE_TESTS !== "1", timeout: 240000 }, async t => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  const dependencies = {
    respond: respondWithChatAgent,
    search: async (q: string, type: string | null, language: string) => (await searchAgentProducts(q, type, language)).map(p => publicAgentProduct(p, language)),
    product: async (type: string, code: string, language: string) => { const p = await getProductDetails(code, language, type); return p ? publicAgentProduct(p, language) : null; },
  };
  const ask = (content: string) => decideChatTurn({ language: "en", profile: {}, history: [{ role: "user", content }] }, dependencies);
  try {
    await t.test("broad needs are gathered before showing a wall of products", async () => {
      const result = await ask("I need a villa in Marrakech, but I haven't decided on budget or group size yet.");
      assert.equal(result.recommendations?.length, 0); assert.match(result.message, /\?/); assert.equal(result.handoff, undefined);
    });
    await t.test("mixed itinerary contains four cards with real media and chosen service prices", async () => {
      const result = await ask("Show me Villa Atlas View, Mercedes V-Class full-day private driver, Nomad Rooftop and Beldi Country Club pool-and-lunch. Just browsing, no reservation or availability check.");
      assert.equal(result.handoff, undefined);
      const cards = result.recommendations || [];
      for (const type of ["VILLA", "TRANSPORTATION", "RESTAURANT", "SWIMMINGPOOL"]) assert.ok(cards.some(c => c.type === type));
      assert.equal(cards.find(c => c.type === "TRANSPORTATION")?.priceEuro, 160);
      assert.equal(cards.find(c => c.type === "SWIMMINGPOOL")?.priceEuro, 75);
      assert.ok(cards.every(c => c.images.length > 0 && c.url.startsWith("/")));
      assert.ok(result.message.split(/\s+/).length <= 60, "Recommendations should be visually led, with brief accompanying text");
      console.log("Mixed collection:", result.message, cards.map(c => ({ title: c.title, plan: c.planTitle, price: c.priceEuro })));
    });
    await t.test("a villa driver-inclusive recommendation has the actual higher rate", async () => {
      const result = await ask("Show me Villa Atlas View at its published driver-inclusive rate, just to browse.");
      assert.equal(result.handoff, undefined); assert.equal(result.recommendations?.[0]?.priceEuro, 950);
      assert.ok(result.recommendations[0].driverLabel);
    });
  } finally { await prisma.$disconnect(); }
});
