import assert from "node:assert/strict";
import test from "node:test";
import { approveAdvisorTransfer } from "../src/services/chat-agent.transfer-consent";
import { decideChatTurn, type AgentContext } from "../src/services/chat-agent.policy";
import { respondWithChatAgent } from "../src/services/chat-agent.openai";
import { getProductDetails, searchAgentProducts } from "../src/services/product.service";
import { publicAgentProduct } from "../src/services/chat-agent.service";
import { prisma } from "../src/config/prisma";

test("live model leaves availability to clients and obtains transfer consent", { skip: process.env.RUN_CHAT_AGENT_LIVE_TESTS !== "1", timeout: 240000 }, async t => {
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  const dependencies = {
    respond: respondWithChatAgent, authorizeTransfer: approveAdvisorTransfer,
    search: async (query: string, type: string | null, language: string, excluded: any[] = []) => (await searchAgentProducts(query, type, language, excluded)).map(p => publicAgentProduct(p, language)),
    product: async (type: string, code: string, language: string) => { const product = await getProductDetails(code, language, type); return product ? publicAgentProduct(product, language) : null; },
  };
  const history: AgentContext["history"] = [{ role: "user", content: "Je cherche une villa à Marrakech." }];
  const context = (): AgentContext => ({ language: "fr", profile: {}, history: [...history] });
  try {
    await t.test("broad product enquiry does not prompt for dates or availability", async () => {
      const result = await decideChatTurn(context(), dependencies);
      assert.equal(result.handoff, undefined);
      assert.doesNotMatch(result.message, /\bdates?\b|\bquand\b|disponib|arriv[ée]|d[ée]part/iu, result.message);
      console.log("LIVE discovery:", result.message);
      history.push({ role: "assistant", content: result.message });
    });
    history.push({ role: "user", content: "Villa Azur (villa-azur) est-elle disponible du 18 au 28 novembre pour 10 personnes ?" });
    await t.test("availability gets an offer, no email or automatic transfer", async () => {
      const result = await decideChatTurn(context(), dependencies);
      assert.equal(result.handoff, undefined);
      assert.match(result.message, /Asmaa/);
      assert.match(result.message, /transf|mettre en relation|passer.*conversation/iu);
      assert.match(result.message, /\?/);
      console.log("LIVE availability offer:", result.message);
      history.push({ role: "assistant", content: result.message });
    });
    const offered = [...history];
    history.push({ role: "user", content: "Pas encore, avant ça je veux savoir si la villa a une piscine privée et connaître son prix par nuit." });
    await t.test("a product follow-up keeps Cécile assigned and answers the question", async () => {
      const result = await decideChatTurn(context(), dependencies);
      assert.equal(result.handoff, undefined);
      assert.match(result.message, /piscine|680/iu);
      console.log("LIVE follow-up:", result.message);
      history.push({ role: "assistant", content: result.message });
    });
    history.push({ role: "user", content: "Maintenant oui, je confirme : transférez cette conversation à Asmaa pour vérifier les dates du 18 au 28 novembre pour 10 personnes." });
    await t.test("agreement without identity/contact details asks only for the missing information", async () => {
      const result = await decideChatTurn(context(), dependencies);
      assert.equal(result.handoff, undefined);
      assert.match(result.message, /nom|prénom/iu);
      assert.match(result.message, /e.?mail|courriel|téléphone/iu);
      console.log("LIVE contact collection:", result.message);
      history.push({ role: "assistant", content: result.message });
    });
    history.push({ role: "user", content: "Je m’appelle Clara Martin. Mon adresse email est clara.martin.qa.20261118@gmail.com." });
    await t.test("only explicit agreement permits the real handoff decision", async () => {
      const result = await decideChatTurn(context(), dependencies);
      assert.equal(result.handoff?.reason, "availability", result.message);
      assert.equal(result.handoff.consentConfirmed, true);
      assert.equal(result.handoff.firstName, "Clara"); assert.equal(result.handoff.lastName, "Martin");
      assert.equal(result.handoff.email, "clara.martin.qa.20261118@gmail.com");
      assert.ok(result.handoff.products.some(p => p.uniqueCode === "villa-azur"));
      console.log("LIVE confirmed transfer:", result.message);
    });
    await t.test("a yes about a pool cannot be mistaken for transfer consent", async () => {
      assert.equal(await approveAdvisorTransfer([
        ...offered,
        { role: "user", content: "Pas encore. Je veux une piscine privée." },
        { role: "assistant", content: "Très bien. Une piscine privée est donc indispensable pour vous ?" },
        { role: "user", content: "Oui" },
      ], "availability"), false);
      assert.equal(await approveAdvisorTransfer([
        { role: "user", content: "Nous sommes dix du 18 au 28 novembre. Est-ce disponible ?" },
      ], "availability"), false);
    });
  } finally { await prisma.$disconnect(); }
});
