type Purpose = "alt" | "translation" | "query";
type ModelEnvironment = Partial<Record<"OPENAI_ALT_MODEL" | "OPENAI_TRANSLATION_MODEL" | "OPENAI_MODEL", string>>;

export function openAIModel(purpose: Purpose, env: ModelEnvironment = process.env) {
  const specific = purpose === "alt" ? env.OPENAI_ALT_MODEL : env.OPENAI_TRANSLATION_MODEL;
  return specific || env.OPENAI_MODEL || "gpt-6.1-sol";
}

export function openAIChatOptions(purpose: "alt" | "translation", temperature: number, env: ModelEnvironment = process.env) {
  const model = openAIModel(purpose, env);
  // Reasoning models reject the legacy sampling parameters. Keep older model requests compatible.
  return /^gpt-[56](?:[.-]|$)|^o\d/.test(model)
    ? { model, reasoning_effort: "low" as const }
    : { model, temperature };
}
