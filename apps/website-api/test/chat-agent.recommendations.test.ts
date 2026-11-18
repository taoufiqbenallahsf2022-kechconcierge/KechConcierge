import assert from "node:assert/strict";
import test from "node:test";
import { decideChatTurn } from "../src/services/chat-agent.policy";
import { productRecommendation } from "../src/services/chat-agent.recommendations";
import { agentHistoryMessage } from "../src/services/chat-agent.service";

const villa = { id: "villa-id", type: "VILLA", uniqueCode: "villa-eden", title: "Villa Eden", priceEuro: 600, priceWithDriverEuro: 700, priceWithDriverLabel: "Private driver included", thumbnail: "https://images.example/villa.jpg", images: ["https://images.example/villa.jpg", "https://images.example/pool.jpg", "javascript:bad"], plans: [] };
const transport = { id: "van-id", type: "TRANSPORTATION", uniqueCode: "van", title: "Family Van", priceEuro: 35, thumbnail: "https://images.example/van.jpg", plans: [{ id: "airport", title: "Airport transfer", salePrice: 35, pricingUnit: "PER_TRIP" }, { id: "day", title: "Full-day driver", salePrice: 160, pricingUnit: "FULL_DAY" }] };
const response = (value: unknown) => ({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }] });
test("card media, localized links and driver pricing come from trusted catalog data", () => {
  const card = productRecommendation(villa, "villa-id:driver", "fr");
  assert.equal(card.priceEuro, 700); assert.equal(card.driverLabel, "Private driver included"); assert.equal(card.url, "/fr/villas/villa-eden");
  assert.deepEqual(card.images, ["https://images.example/villa.jpg", "https://images.example/pool.jpg"]);
});
test("a chosen transport plan shows its exact price and unit rather than the cheapest price", () => {
  const card = productRecommendation(transport, "day", "en");
  assert.equal(card.priceEuro, 160); assert.equal(card.planTitle, "Full-day driver"); assert.equal(card.pricingUnit, "FULL_DAY");
  assert.equal(productRecommendation(transport, null, "en").priceEuro, 35);
  assert.throws(() => productRecommendation(transport, "other-product-plan", "en"), /does not belong/);
  assert.throws(() => productRecommendation(transport, "van-id:driver", "en"), /no published/);
});
test("unknown prices stay unknown and cannot become zero or an invented quote", () => {
  assert.equal(productRecommendation({ ...villa, priceEuro: null }, null, "en").priceEuro, null);
});
test("model references are validated and persisted card values are hydrated by the server", async () => {
  const replies = [
    { output: [{ type: "function_call", name: "search_products", call_id: "search", arguments: JSON.stringify({ query: "", product_type: null }) }] },
    response({ message: "Here is a villa and private driver option.", price_quotes: [], recommendations: [{ product_type: "VILLA", unique_code: "invented", price_source_id: null }] }),
    response({ message: "Here is a villa and private driver option.", price_quotes: [], recommendations: [{ product_type: "VILLA", unique_code: villa.uniqueCode, price_source_id: "villa-id:driver" }, { product_type: "TRANSPORTATION", unique_code: "van", price_source_id: "day" }] }),
  ];
  const result = await decideChatTurn({ language: "en", profile: {}, history: [{ role: "user", content: "Suggest a villa and driver" }] }, {
    search: async () => [villa, transport], product: async (type) => type === "VILLA" ? villa : transport,
    respond: async () => { assert.ok(replies.length); return replies.shift(); },
  });
  assert.equal(result.recommendations?.length, 2); assert.equal(result.recommendations[0].priceEuro, 700); assert.equal(result.recommendations[1].priceEuro, 160);
});
test("follow-up history retains the display order without accepting client-supplied cards", () => {
  const cards = [productRecommendation(villa, null, "en"), productRecommendation(transport, "day", "en")];
  const history = agentHistoryMessage({ senderType: "AI", message: "My suggestions", recommendations: cards });
  assert.ok(history.content.indexOf("villa-eden") < history.content.indexOf('"van"'));
  assert.equal(agentHistoryMessage({ senderType: "VISITOR", message: "Hi", recommendations: cards }).content, "Hi");
});
