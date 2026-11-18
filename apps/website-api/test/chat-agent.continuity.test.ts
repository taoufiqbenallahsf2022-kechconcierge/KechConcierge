import assert from "node:assert/strict";
import test from "node:test";
import { decideChatTurn, instructions, type AgentContext } from "../src/services/chat-agent.policy";
import { recommendationMemory } from "../src/services/chat-agent.service";

const product = (code: string) => ({ id: code, uniqueCode: code, type: "ACTIVITY", title: code, priceEuro: 60 });
const ref = (code: string) => ({ product_type: "ACTIVITY", unique_code: code, price_source_id: null });
const reply = (codes: string[], mode = "new_options") => ({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ message: "Here are some options.", price_quotes: [], recommendation_mode: mode, recommendations: codes.map(ref) }) }] }] });
const search = { output: [{ type: "function_call", call_id: "search", name: "search_products", arguments: JSON.stringify({ query: "", product_type: "ACTIVITY", exclude_previously_shown: true }) }] };
const context: AgentContext = { language: "en", profile: {}, previouslyShown: [{ type: "ACTIVITY", uniqueCode: "option-1", title: "First option" }, { type: "ACTIVITY", uniqueCode: "option-2", title: "Second option" }], history: [{ role: "user", content: "Something else please" }] };

test("other options exclude every previous product and a recycled draft is rejected", async () => {
  const outputs = [search, reply(["option-1"]), reply(["option-3"])];
  let exclusions: any;
  const result = await decideChatTurn(context, {
    respond: async () => { assert.ok(outputs.length); return outputs.shift(); },
    search: async (_q, _t, _l, excluded) => { exclusions = excluded; return [product("option-1"), product("option-2"), product("option-3")]; },
    product: async (_type, code) => product(code),
  });
  assert.deepEqual(exclusions, context.previouslyShown);
  assert.equal(result.recommendations?.[0].uniqueCode, "option-3");
});
test("switching the draft to revisit cannot bypass an alternatives-only search", async () => {
  const outputs = [search, reply(["option-1"], "revisit"), reply([])];
  const result = await decideChatTurn(context, { respond: async () => outputs.shift(), search: async () => [product("option-1")], product: async (_type, code) => product(code) });
  assert.deepEqual(result.recommendations, []);
});
test("an explicit return to an earlier option is allowed", async () => {
  const outputs = [{ output: [{ type: "function_call", call_id: "get", name: "get_product", arguments: JSON.stringify({ product_type: "ACTIVITY", unique_code: "option-1" }) }] }, reply(["option-1"], "revisit")];
  const result = await decideChatTurn({ ...context, history: [{ role: "user", content: "Go back to the first option" }] }, { respond: async () => outputs.shift(), search: async () => [], product: async (_type, code) => product(code) });
  assert.equal(result.recommendations?.[0].uniqueCode, "option-1");
});
test("memory keeps older recommendations beyond the recent transcript and deduplicates cards", () => {
  const rows = Array.from({ length: 50 }, (_, index) => ({ recommendations: [{ type: "ACTIVITY", uniqueCode: `trip-${index}`, title: `Trip ${index}` }] }));
  const memory = recommendationMemory([...rows, rows[0], { recommendations: null } as any]);
  assert.equal(memory.length, 50); assert.equal(memory[0].uniqueCode, "trip-0");
  assert.equal(memory[49].uniqueCode, "trip-49");
});
test("business-overview guidance explicitly keeps the question in scope and brief", () => {
  const prompt = instructions({ language: "en", profile: {}, history: [] });
  assert.match(prompt, /BUSINESS OVERVIEW/); assert.match(prompt, /one or two sentences/);
  assert.match(prompt, /No product lookup, cards, long inventory or Contact referral/);
});
