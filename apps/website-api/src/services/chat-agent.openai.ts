import { AGENT_TOOLS, CHAT_AGENT_MODEL, REPLY_FORMAT } from "./chat-agent.policy";

export async function respondWithChatAgent(input: any[], instructions: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", signal: AbortSignal.timeout(25000),
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: CHAT_AGENT_MODEL, instructions, input, tools: AGENT_TOOLS,
      parallel_tool_calls: false, reasoning: { effort: "low" }, max_output_tokens: 2200,
      text: { format: REPLY_FORMAT }, include: ["reasoning.encrypted_content"], store: false }),
  });
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(`OpenAI chat request failed (${response.status}): ${body.error?.code || "upstream_error"}`);
  if (body.status !== "completed") throw new Error("OpenAI chat response was incomplete");
  return body;
}
