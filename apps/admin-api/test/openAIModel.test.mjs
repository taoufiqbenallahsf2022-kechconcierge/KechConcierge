import assert from "node:assert/strict";
import test from "node:test";
import { openAIModel, openAIChatOptions } from "../dist/apps/admin-api/src/services/openAIModel.js";
import { generateProductTranslation } from "../dist/apps/admin-api/src/services/entities/productService.js";
import { translateHeroText } from "../dist/apps/admin-api/src/services/heroTranslationService.js";
import { prisma, pool } from "../dist/apps/admin-api/src/lib/prisma.js";

test("original model variables retain precedence; no Query Agent variable is needed", () => {
  const env = { OPENAI_ALT_MODEL: "alt-model", OPENAI_TRANSLATION_MODEL: "text-model", OPENAI_MODEL: "fallback" };
  assert.equal(openAIModel("alt", env), "alt-model");
  assert.equal(openAIModel("translation", env), "text-model");
  assert.equal(openAIModel("query", env), "text-model");
  assert.equal(openAIModel("query", { OPENAI_MODEL: "fallback" }), "fallback");
  assert.equal(openAIModel("query", {}), "gpt-6.1-sol");
  assert.deepEqual(openAIChatOptions("translation", 0.1, { OPENAI_TRANSLATION_MODEL: "gpt-4.1-mini" }), { model: "gpt-4.1-mini", temperature: 0.1 });
  assert.deepEqual(openAIChatOptions("alt", 0.15, { OPENAI_ALT_MODEL: "gpt-6.1-sol" }), { model: "gpt-6.1-sol", reasoning_effort: "low" });
});

test("product and hero translation preserve their response contracts with the new and old model settings", async () => {
  const originalFetch = globalThis.fetch;
  const names = ["OPENAI_API_KEY", "OPENAI_TRANSLATION_MODEL", "OPENAI_ALT_MODEL"];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  process.env.OPENAI_API_KEY = "local-mock-key";
  const source = { title: "Villa QA", description: "Private pool", priceWithDriverLabel: "Driver included", tags: ["Pool"], details: [{ label: "Rooms", value: "3" }] };
  const translated = { title: "Villa QA", subtitle: "", priceTitle: "", priceWithDriverLabel: "Chauffeur inclus", description: "Piscine privée", address: "", tags: ["Piscine"], details: [{ label: "Chambres", value: "3" }] };
  const hero = { eyebrow: "Marrakech", title: "Villa QA", description: "Private pool", buttonLabel: "Explore", altText: "Pool" };
  try {
    for (const model of ["gpt-6.1-sol", "gpt-4.1-mini"]) {
      process.env.OPENAI_TRANSLATION_MODEL = model;
      let calls = 0;
      globalThis.fetch = async (_url, init) => {
        const body = JSON.parse(init.body); calls++;
        assert.equal(body.model, model);
        assert.equal(body.response_format.type, "json_object");
        if (model === "gpt-6.1-sol") { assert.equal("temperature" in body, false); assert.equal(body.reasoning_effort, "low"); }
        else assert.equal(body.temperature, 0.1);
        const output = calls === 1 ? { content: translated } : Object.fromEntries(["fr", "de", "it", "pt", "es"].map(code => [code, hero]));
        return Response.json({ choices: [{ message: { content: JSON.stringify(output) } }] });
      };
      assert.deepEqual(await generateProductTranslation({ targetLanguage: "fr", source }), { content: translated });
      assert.deepEqual(Object.keys(await translateHeroText(hero)), ["fr", "de", "it", "pt", "es"]);
      assert.equal(calls, 2);
    }
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
    await prisma.$disconnect(); await pool.end();
  }
});
