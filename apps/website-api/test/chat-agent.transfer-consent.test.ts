import assert from "node:assert/strict";
import test from "node:test";
import { approveAdvisorTransfer } from "../src/services/chat-agent.transfer-consent";
import type { AgentContext } from "../src/services/chat-agent.policy";

const history: AgentContext["history"] = [
  { role: "assistant", content: "Asmaa is our availability advisor. May I transfer this chat to her?" },
  { role: "user", content: "Yes, please transfer this chat to Asmaa." },
];
const response = (approved: boolean, quote: string | null, status = "completed") => new Response(JSON.stringify({ status, output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ approved, confirmation_quote: quote }) }] }] }), { status: 200 });

test("the independent consent check uses the actual conversation and requires client evidence", async () => {
  const request = (async (_url: unknown, options: RequestInit) => {
    const body = JSON.parse(String(options.body));
    assert.deepEqual(body.input, history);
    assert.equal(body.store, false);
    assert.equal(body.tools, undefined);
    assert.match(body.instructions, /availability enquiry.*NOT transfer consent/s);
    return response(true, "Yes, please transfer this chat to Asmaa.");
  }) as typeof fetch;
  assert.equal(await approveAdvisorTransfer(history, "availability", request), true);
  assert.equal(await approveAdvisorTransfer(history, "availability", (async () => response(true, "Invented consent")) as typeof fetch), false);
  assert.equal(await approveAdvisorTransfer(history, "availability", (async () => response(false, null)) as typeof fetch), false);
});

test("consent validation fails closed on outages, malformed or incomplete output", async () => {
  const failures = [
    async () => { throw new Error("Network unavailable"); },
    async () => new Response("upstream error", { status: 503 }),
    async () => new Response("invalid JSON", { status: 200 }),
    async () => response(true, "Yes, please transfer this chat to Asmaa.", "incomplete"),
    async () => response(true, null),
  ];
  for (const request of failures) assert.equal(await approveAdvisorTransfer(history, "availability", request as typeof fetch), false);
  assert.equal(await approveAdvisorTransfer(history.slice(0, 1), "availability", (async () => response(true, history[0].content)) as typeof fetch), false);
});
