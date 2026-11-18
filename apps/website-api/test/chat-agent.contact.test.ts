import assert from "node:assert/strict";
import test from "node:test";
import { assertHandoffContact } from "../src/services/chat-agent.contact";

test("handoff requires the full name and at least one usable contact method", () => {
  const base = { firstName: "Clara", lastName: "Martin", email: null, phone: null };
  assert.throws(() => assertHandoffContact(base), /email address OR phone/);
  assert.throws(() => assertHandoffContact({ ...base, firstName: null, email: "clara@example.invalid" }), /full name/);
  assert.throws(() => assertHandoffContact({ ...base, lastName: "  ", email: "clara@example.invalid" }), /full name/);
  assert.throws(() => assertHandoffContact({ ...base, email: "not-an-email", phone: "123" }), /valid email/);
  assert.throws(() => assertHandoffContact({ ...base, phone: "call me tomorrow 1234567" }), /valid email/);
  assert.doesNotThrow(() => assertHandoffContact({ ...base, email: "clara@example.invalid" }));
  assert.doesNotThrow(() => assertHandoffContact({ ...base, phone: "+33 6 12 34 56 78" }));
  assert.doesNotThrow(() => assertHandoffContact({ ...base, email: "clara@example.invalid", phone: "+212 6 13 85 98 34" }));
});
