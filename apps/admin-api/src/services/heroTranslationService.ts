const targetLanguages = { fr: "French", de: "German", it: "Italian", pt: "Portuguese", es: "Spanish" } as const;
export type HeroText = { eyebrow: string; title: string; description: string; buttonLabel: string; altText: string };
export async function translateHeroText(english: HeroText): Promise<Record<string, HeroText>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("AI translation is not configured"), { status: 503 });
  const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_TRANSLATION_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini", temperature: 0.1, response_format: { type: "json_object" }, messages: [{ role: "system", content: `Translate this luxury travel hero-slide copy from English into ${Object.entries(targetLanguages).map(([code, name]) => `${code} (${name})`).join(", ")}. Keep the tone elegant and natural. Preserve proper names, numbers and meaning; never add facts. Return only JSON shaped {"fr":{"eyebrow":"","title":"","description":"","buttonLabel":"","altText":""},"de":{...},"it":{...},"pt":{...},"es":{...}}.` }, { role: "user", content: JSON.stringify(english) }] }) });
  const payload: any = await response.json();
  if (!response.ok) throw Object.assign(new Error(payload?.error?.message || "OpenAI translation failed"), { status: 502 });
  let parsed: any; try { parsed = JSON.parse(payload?.choices?.[0]?.message?.content || "{}"); } catch { throw Object.assign(new Error("OpenAI returned invalid translations"), { status: 502 }); }
  const result: Record<string, HeroText> = {};
  for (const code of Object.keys(targetLanguages)) { const value = parsed?.[code]; if (!value?.title) throw Object.assign(new Error(`OpenAI returned an incomplete ${code.toUpperCase()} translation`), { status: 502 }); result[code] = { eyebrow: String(value.eyebrow ?? "").trim(), title: String(value.title ?? "").trim(), description: String(value.description ?? "").trim(), buttonLabel: String(value.buttonLabel ?? "").trim(), altText: String(value.altText ?? "").trim() }; }
  return result;
}
