import assert from "node:assert/strict";
import test from "node:test";
import { decideChatTurn, developmentAgentEnabled, instructions, type AgentContext, type AgentDependencies } from "../src/services/chat-agent.policy";

const villa = { id: "villa-id", type: "VILLA", uniqueCode: "villa-eden", title: "Villa Eden", priceEuro: 600, priceWithDriverEuro: 700, url: "/villas/villa-eden" };
const context = (message = "Tell me about Villa Eden", language = "en"): AgentContext => ({ language, profile: {}, history: [{ role: "user", content: message }] });
const call = (name: string, args: unknown) => ({ output: [{ type: "function_call", name, call_id: name, arguments: JSON.stringify(args) }] });
const reply = (message: string, prices: any[] = []) => ({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ message, price_quotes: prices }) }] }] });
function dependencies(outputs: any[]): AgentDependencies {
  return { authorizeTransfer: async () => true, search: async () => [villa], product: async () => villa, respond: async () => { assert.ok(outputs.length, "Unexpected extra model turn"); return outputs.shift(); } };
}
const search = () => call("search_products", { query: "Eden", product_type: "VILLA" });
const handoff = (reason = "availability", details = {}) => call("handoff_to_advisor", { reason, summary: "Availability for Villa Eden on 20 November", products: [{ product_type: "VILLA", unique_code: villa.uniqueCode }], first_name: null, last_name: null, email: null, phone: null, ...details });

test("agent is development-only, requires an existing key and a local database", () => {
  const env = { NODE_ENV: "local", OPENAI_API_KEY: "test-key", DATABASE_URL: "postgres://user@localhost/db" };
  assert.equal(developmentAgentEnabled(env), true);
  assert.equal(developmentAgentEnabled({ ...env, NODE_ENV: "production" }), false);
  assert.equal(developmentAgentEnabled({ ...env, NODE_ENV: "test", DATABASE_URL: "postgres://user@staging.example/db" }), false);
  assert.equal(developmentAgentEnabled({ ...env, OPENAI_API_KEY: "" }), false);
});
test("catalog prices are grounded; an invented discount is rejected and corrected", async () => {
  const outputs = [search(), reply("The price is 500 EUR", [{ source_id: villa.id, amount_eur: 500 }]), reply("The price is 600 EUR", [{ source_id: villa.id, amount_eur: 600 }])];
  const result = await decideChatTurn(context(), dependencies(outputs));
  assert.equal(result.message, "The price is 600 EUR"); assert.equal(result.handoff, undefined); assert.equal(outputs.length, 0);
});
test("an unreferenced price is rejected even when price_quotes is empty", async () => {
  const result = await decideChatTurn(context(), dependencies([reply("It is 500 EUR"), reply("Which villa interests you?")]));
  assert.equal(result.message, "Which villa interests you?");
});
for (const reason of ["availability", "pricing_negotiation"]) {
  test(`${reason} prepares a handoff using real products and client-provided identity only`, async () => {
    const agreed = context("Yes, transfer this chat to Asmaa. My full name is Clara Martin. Email me at client@example.invalid");
    agreed.history.unshift({ role: "assistant", content: "Asmaa is our availability advisor. May I transfer this chat to her?" });
    const result = await decideChatTurn(agreed, dependencies([search(), handoff(reason, { email: "client@example.invalid", first_name: "Clara", last_name: "Martin" }), reply("Asmaa will take over in this chat.")]));
    assert.equal(result.handoff?.consentConfirmed, true); assert.equal(result.handoff?.reason, reason); assert.equal(result.handoff?.products[0].id, villa.id);
    assert.equal(result.handoff?.email, "client@example.invalid"); assert.equal(result.handoff?.firstName, "Clara"); assert.equal(result.handoff?.lastName, "Martin");
  });
}
test("handoff cannot reference a product that was never retrieved", async () => {
  const result = await decideChatTurn(context(), dependencies([handoff(), reply("Which villa interests you?")]));
  assert.equal(result.handoff, undefined);
});
for (const reason of ["partnership", "support", "complaint", "other"]) {
  test(`${reason} uses the localized Contact link without a handoff`, async () => {
    const result = await decideChatTurn(context("J’ai une question", "fr"), dependencies([call("contact_page", { reason }), reply("Contactez notre équipe via [Contact](/fr/contact).")]));
    assert.equal(result.contactRedirect, true); assert.equal(result.handoff, undefined);
  });
}
test("a contact referral without its link is corrected", async () => {
  const result = await decideChatTurn(context(), dependencies([call("contact_page", { reason: "support" }), reply("Contact our team."), reply("Go to /contact"), reply("Please use [Contact](/contact).")]));
  assert.match(result.message, /\[Contact\]\(\/contact\)/);
});
test("a legacy product fallback cannot expose a hidden category through a public tool", async () => {
  const deps = dependencies([call("get_product", { product_type: "VILLA", unique_code: "hidden-spa" }), reply("Which villa interests you?")]);
  deps.product = async () => ({ ...villa, type: "SPA", uniqueCode: "hidden-spa" });
  const result = await decideChatTurn(context(), deps);
  assert.equal(result.message, "Which villa interests you?"); assert.equal(result.handoff, undefined);
});
test("Cécile introduces herself only on the first assistant turn", () => {
  assert.match(instructions(context()), /FIRST reply only, introduce yourself briefly as Cécile/);
  const returning = context(); returning.history.unshift({ role: "assistant", content: "Hello, I am Cécile, the AI Assistant." });
  assert.match(instructions(returning), /Do NOT repeat your name, AI identity or an introduction/);
  assert.doesNotMatch(instructions(returning), /FIRST reply only/);
});


test("an availability tool call without consent cannot prepare a handoff", async () => {
  const deps = dependencies([search(), handoff(), reply("Asmaa is our availability advisor. May I transfer this chat to her?")]);
  deps.authorizeTransfer = async () => false;
  const result = await decideChatTurn(context("Is Villa Eden available on 20 November?"), deps);
  assert.equal(result.handoff, undefined);
  assert.match(result.message, /May I transfer/);
});

test("missing consent verification fails closed", async () => {
  const deps = dependencies([search(), handoff(), reply("Would you like me to transfer this chat to Asmaa?")]);
  delete deps.authorizeTransfer;
  const result = await decideChatTurn(context("We are ten people, 18-28 November"), deps);
  assert.equal(result.handoff, undefined);
});

test("declining or continuing product questions preserves the assistant", async () => {
  const followup = context("Not yet. Does it have a private pool?");
  followup.history.unshift({ role: "assistant", content: "Asmaa handles availability. Shall I transfer this chat?" });
  const deps = dependencies([search(), handoff(), reply("Let’s look at the villa details first.")]);
  let checks = 0;
  deps.authorizeTransfer = async (history) => { checks++; assert.equal(history.at(-1)?.content, "Not yet. Does it have a private pool?"); return false; };
  const result = await decideChatTurn(followup, deps);
  assert.equal(result.handoff, undefined);
  assert.equal(checks, 1);
});


test("consent alone cannot transfer a visitor without full name and contact details", async () => {
  const result = await decideChatTurn(context("Yes, transfer me to Asmaa."), dependencies([search(), handoff(), reply("Could I have your full name and an email address or phone number so Asmaa can reach you if you leave the website?")]));
  assert.equal(result.handoff, undefined);
  assert.match(result.message, /full name/);
});

test("a valid phone and full name suffice; email is not mandatory", async () => {
  const result = await decideChatTurn(context("Yes, transfer me. I am Clara Martin; my phone is +33 6 12 34 56 78."), dependencies([
    search(), handoff("availability", { first_name: "Clara", last_name: "Martin", phone: "+33612345678" }), reply("Asmaa will continue here."),
  ]));
  assert.equal(result.handoff?.phone, "+33612345678");
  assert.equal(result.handoff?.email, null);
});

test("complete known profile details are reused without collecting them again", async () => {
  const known = context("Yes, transfer this chat to Asmaa.");
  known.profile = { firstName: "Clara", lastName: "Martin", email: "clara@example.invalid" };
  const result = await decideChatTurn(known, dependencies([search(), handoff(), reply("Asmaa will continue here.")]));
  assert.equal(result.handoff?.firstName, "Clara"); assert.equal(result.handoff?.email, "clara@example.invalid");
});

test("a name invented by the model cannot satisfy the transfer prerequisite", async () => {
  const result = await decideChatTurn(context("Yes, transfer me. Email client@example.invalid"), dependencies([
    search(), handoff("availability", { first_name: "Invented", last_name: "Identity", email: "client@example.invalid" }), reply("What is your full name?"),
  ]));
  assert.equal(result.handoff, undefined);
});
