import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";

import {
  assertSessionMatchesPayment,
  buildCheckoutSessionParams,
  canReuseCheckoutSession,
  createCheckoutSession,
  isStripePaymentAvailable,
  toMinorUnits,
  transitionForCheckoutEvent,
  verifyStripeWebhook,
} from "../dist/apps/admin-api/src/payments/stripePayments.js";

const payment = {
  id: "payment_123",
  orderId: "order_456",
  amount: "120.50",
  currency: "EUR",
  publicToken: "public-token",
  clientEmail: "guest@example.com",
  orderNumber: "MC-1001",
};

test("reports Stripe payments unavailable until both server secrets exist", () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;
  const originalWebhook = process.env.STRIPE_WEBHOOK_SECRET;

  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  assert.equal(isStripePaymentAvailable(), false);

  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  assert.equal(isStripePaymentAvailable(), false);

  process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock";
  assert.equal(isStripePaymentAvailable(), true);

  if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = originalKey;
  if (originalWebhook === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = originalWebhook;
});

function checkoutSession(overrides = {}) {
  return {
    id: "cs_test_123",
    object: "checkout.session",
    amount_total: 12050,
    currency: "eur",
    client_reference_id: payment.id,
    metadata: { paymentId: payment.id, orderId: payment.orderId },
    payment_intent: "pi_test_123",
    payment_status: "paid",
    ...overrides,
  };
}

function checkoutEvent(type, session) {
  return {
    id: "evt_test_123",
    object: "event",
    api_version: "2025-02-24.acacia",
    created: 1,
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type,
    data: { object: session },
  };
}

test("builds a hosted Checkout Session from server-owned payment data", () => {
  const params = buildCheckoutSessionParams(payment, "http://localhost:3000/");
  const price = params.line_items?.[0]?.price_data;

  assert.equal(params.mode, "payment");
  assert.equal(params.customer_email, payment.clientEmail);
  assert.equal(params.client_reference_id, payment.id);
  assert.equal(price?.unit_amount, 12050);
  assert.equal(price?.currency, "eur");
  assert.equal(params.metadata?.paymentId, payment.id);
  assert.equal(params.metadata?.orderId, payment.orderId);
  assert.equal(
    params.success_url,
    "http://localhost:3000/pay/public-token?session_id={CHECKOUT_SESSION_ID}",
  );
  assert.equal(params.cancel_url, "http://localhost:3000/pay/public-token?cancelled=1");
});

test("uses the supplied idempotency key with a mocked Stripe client", async () => {
  let receivedParams;
  let receivedOptions;
  const expected = checkoutSession({ url: "https://checkout.stripe.com/test" });
  const mockClient = {
    checkout: {
      sessions: {
        async create(params, options) {
          receivedParams = params;
          receivedOptions = options;
          return expected;
        },
      },
    },
  };

  const result = await createCheckoutSession(
    mockClient,
    payment,
    "http://localhost:3000",
    "checkout-payment_123-initial",
  );

  assert.equal(result, expected);
  assert.equal(receivedParams?.metadata?.paymentId, payment.id);
  assert.equal(receivedOptions?.idempotencyKey, "checkout-payment_123-initial");
});

test("converts ordinary and zero-decimal currencies to minor units", () => {
  assert.equal(toMinorUnits("12.34", "EUR"), 1234);
  assert.equal(toMinorUnits("500", "JPY"), 500);
  assert.throws(() => toMinorUnits("0", "EUR"), /greater than zero/);
});

test("reuses only an active Checkout URL", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  assert.equal(
    canReuseCheckoutSession(
      "https://checkout.stripe.com/active",
      new Date("2026-10-11T13:00:00Z"),
      now,
    ),
    true,
  );
  assert.equal(
    canReuseCheckoutSession(
      "https://checkout.stripe.com/expired",
      new Date("2026-10-11T12:00:30Z"),
      now,
    ),
    false,
  );
});

test("validates amount, currency and metadata before fulfillment", () => {
  assert.doesNotThrow(() => assertSessionMatchesPayment(checkoutSession(), payment));
  assert.throws(
    () => assertSessionMatchesPayment(checkoutSession({ amount_total: 1 }), payment),
    /do not match/,
  );
  assert.throws(
    () => assertSessionMatchesPayment(checkoutSession({ currency: "usd" }), payment),
    /do not match/,
  );
  assert.throws(
    () =>
      assertSessionMatchesPayment(
        checkoutSession({ metadata: { paymentId: payment.id } }),
        payment,
      ),
    /do not match/,
  );
});

test("maps paid, failed and expired events without trusting unpaid completion", () => {
  assert.deepEqual(
    transitionForCheckoutEvent(checkoutEvent("checkout.session.completed", checkoutSession())),
    { kind: "paid", paymentId: payment.id, paymentIntentId: "pi_test_123" },
  );
  assert.deepEqual(
    transitionForCheckoutEvent(
      checkoutEvent(
        "checkout.session.completed",
        checkoutSession({ payment_status: "unpaid" }),
      ),
    ),
    { kind: "none", paymentId: payment.id },
  );
  assert.equal(
    transitionForCheckoutEvent(
      checkoutEvent("checkout.session.async_payment_failed", checkoutSession()),
    ).kind,
    "failed",
  );
  assert.equal(
    transitionForCheckoutEvent(
      checkoutEvent("checkout.session.expired", checkoutSession()),
    ).kind,
    "expired",
  );
});

test("verifies a signed mock webhook and rejects an invalid signature", () => {
  const stripe = new Stripe("sk_test_mock");
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({
    id: "evt_test_signed",
    object: "event",
    type: "checkout.session.completed",
    data: { object: checkoutSession() },
  });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });

  const event = verifyStripeWebhook(payload, signature, secret, stripe);
  assert.equal(event.id, "evt_test_signed");
  assert.throws(
    () => verifyStripeWebhook(payload, "t=1,v1=invalid", secret, stripe),
    /signature/i,
  );
});

test("the Express webhook route preserves the signed raw request body", async () => {
  const stripe = new Stripe("sk_test_mock");
  const secret = "whsec_route_test_secret";
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  const payload = JSON.stringify({
    id: "evt_route_test",
    object: "event",
    type: "customer.created",
    data: { object: { id: "cus_test", object: "customer" } },
  });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  const [{ app }, { prisma }] = await Promise.all([
    import("../dist/apps/admin-api/src/app.js"),
    import("../dist/apps/admin-api/src/lib/prisma.js"),
  ]);
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/public/stripe/webhook`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": signature,
        },
        body: payload,
      },
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { received: true });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await prisma.$disconnect();
  }
});
