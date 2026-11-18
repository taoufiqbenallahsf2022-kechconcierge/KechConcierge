import assert from "node:assert/strict";
import test from "node:test";
import { chatInvitationSeen, claimChatInvitation, invitationCopy, invitationTopic } from "../src/lib/chat-invitation";

test("invitations match the actual discovery page in all six languages", () => {
  for (const locale of ["en", "fr", "es", "it", "de", "pt"] as const) {
    const prefix = locale === "en" ? "" : `/${locale}`;
    assert.equal(invitationTopic(`${prefix}/`), "general");
    for (const category of ["villas", "beachclubs", "nightclubs", "transportation", "restaurants"] as const) {
      assert.equal(invitationTopic(`${prefix}/${category}`), category);
      assert.equal(invitationTopic(`${prefix}/${category}/product-code`), category);
      assert.ok(invitationCopy[locale].messages[category].length > 30);
    }
    assert.equal(invitationTopic(`${prefix}/experiences`), "experiences");
    assert.equal(invitationTopic(`${prefix}/activities/ourika`), "experiences");
    assert.ok(invitationCopy[locale].messages.general);
    assert.ok(invitationCopy[locale].cta.includes("Cécile"));
  }
});

test("chat, accounts, forms, legal and payment flows do not receive invitations", () => {
  for (const prefix of ["", "/fr", "/de"]) {
    for (const path of ["/chat", "/chat/existing-conversation", "/account", "/contact", "/checkout", "/payment/success", "/privacy-policy", "/terms", "/login", "/packs", "/spa", "/unknown"]) {
      assert.equal(invitationTopic(`${prefix}${path}`), null, `${prefix}${path}`);
    }
  }
});


test("an invitation is shown once for a visitor across sessions and tabs", () => {
  const saved = new Map<string, string>();
  const browserStorage = () => ({
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => { saved.set(key, value); },
  });
  assert.equal(chatInvitationSeen(browserStorage(), "visitor-a"), false);
  assert.equal(claimChatInvitation(browserStorage(), "visitor-a"), true);
  assert.equal(chatInvitationSeen(browserStorage(), "visitor-a"), true);
  assert.equal(claimChatInvitation(browserStorage(), "visitor-a"), false);
  assert.equal(claimChatInvitation(browserStorage(), "visitor-b"), true);
});

test("blocked persistence does not cause repeated invitations", () => {
  const blocked = { getItem: () => { throw new Error("Blocked"); }, setItem: () => { throw new Error("Blocked"); } };
  assert.equal(chatInvitationSeen(blocked, "visitor-a"), true);
  assert.equal(claimChatInvitation(blocked, "visitor-a"), false);
});
