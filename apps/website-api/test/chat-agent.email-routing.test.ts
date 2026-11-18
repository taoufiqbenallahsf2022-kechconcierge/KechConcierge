import assert from "node:assert/strict";
import test, { after } from "node:test";
import { sendHandoffEmail } from "../src/services/chat-agent.service";
import { ASMAA_EMAIL, DEV_HANDOFF_EMAIL } from "../src/services/chat-agent.policy";
import { prisma } from "../src/config/prisma";

after(async () => { await prisma.$disconnect(); });

for (const environment of ["production", "test", "local"]) {
  test(`${environment} handoff notification uses the correct recipient without sending email`, async () => {
    const previous = { NODE_ENV: process.env.NODE_ENV, OPENAI_API_KEY: process.env.OPENAI_API_KEY, DATABASE_URL: process.env.DATABASE_URL };
    Object.assign(process.env, { NODE_ENV: environment, OPENAI_API_KEY: "mock-test-key", DATABASE_URL: "postgresql://fixture@localhost/fixture" });
    const expected = environment === "production" ? ASMAA_EMAIL : DEV_HANDOFF_EMAIL;
    const sent: any[] = [];
    const delivery = { send: async (payload: any) => { sent.push(payload); return { data: { id: "mock-email" }, error: null }; } };
    try {
      const id = await sendHandoffEmail({ id: "fixture", recipient: expected, reason: "availability", emailBody: "Fixture only" }, delivery);
      assert.equal(id, "mock-email");
      assert.deepEqual(sent[0].to, [expected]);
      if (environment === "production") assert.ok(!sent[0].subject.startsWith("["));
      else assert.ok(sent[0].subject.startsWith(environment === "test" ? "[TEST]" : "[DEV]"));
      await assert.rejects(sendHandoffEmail({ id: "wrong", recipient: environment === "production" ? DEV_HANDOFF_EMAIL : ASMAA_EMAIL }, delivery), /authorized recipient/);
      assert.equal(sent.length, 1);
    } finally {
      for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    }
  });
}
