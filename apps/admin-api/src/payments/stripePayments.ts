import Stripe from "stripe";

export type CheckoutPayment = {
  id: string;
  orderId: string;
  amount: string | number;
  currency: string;
  publicToken: string;
  clientEmail: string;
  orderNumber: string;
};

export type StripeSessionTransition =
  | { kind: "paid"; paymentId: string | null; paymentIntentId: string | null }
  | { kind: "failed"; paymentId: string | null }
  | { kind: "expired"; paymentId: string | null }
  | { kind: "none"; paymentId: string | null };

let stripeClient: Stripe | undefined;

export function isStripePaymentAvailable() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim(),
  );
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw Object.assign(new Error("Stripe is not configured"), { status: 503 });
  }

  if (!stripeClient) stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw Object.assign(new Error("Stripe webhook is not configured"), { status: 503 });
  }
  return secret;
}

export function currencyFractionDigits(currency: string): number {
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error("Currency must be a three-letter ISO code");

  try {
    const digits = new Intl.NumberFormat("en", {
      style: "currency",
      currency: normalized,
    }).resolvedOptions().maximumFractionDigits;
    if (digits === undefined) throw new Error(`Unsupported currency: ${normalized}`);
    return digits;
  } catch {
    throw new Error(`Unsupported currency: ${normalized}`);
  }
}

export function toMinorUnits(amount: string | number, currency: string) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const multiplier = 10 ** currencyFractionDigits(currency);
  const minorUnits = Math.round((numericAmount + Number.EPSILON) * multiplier);
  if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
    throw new Error("Payment amount is outside the supported range");
  }
  return minorUnits;
}

export function buildCheckoutSessionParams(
  payment: CheckoutPayment,
  websiteUrl: string,
): Stripe.Checkout.SessionCreateParams {
  const site = websiteUrl.replace(/\/$/, "");
  const currency = payment.currency.toLowerCase();
  const metadata = {
    paymentId: payment.id,
    orderId: payment.orderId,
  };

  return {
    mode: "payment",
    customer_email: payment.clientEmail,
    client_reference_id: payment.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toMinorUnits(payment.amount, payment.currency),
          product_data: {
            name: `Moorish Concierge order ${payment.orderNumber}`,
            description: "Secure advance payment",
          },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    success_url: `${site}/pay/${payment.publicToken}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/pay/${payment.publicToken}?cancelled=1`,
  };
}

type CheckoutSessionsClient = {
  checkout: {
    sessions: {
      create(
        params: Stripe.Checkout.SessionCreateParams,
        options?: Stripe.RequestOptions,
      ): Promise<Stripe.Checkout.Session>;
    };
  };
};

export async function createCheckoutSession(
  client: CheckoutSessionsClient,
  payment: CheckoutPayment,
  websiteUrl: string,
  idempotencyKey: string,
) {
  return client.checkout.sessions.create(
    buildCheckoutSessionParams(payment, websiteUrl),
    { idempotencyKey },
  );
}

export function canReuseCheckoutSession(
  checkoutUrl: string | null,
  expiresAt: Date | null,
  now = new Date(),
) {
  return Boolean(checkoutUrl && expiresAt && expiresAt.getTime() > now.getTime() + 60_000);
}

export function paymentIntentId(session: Stripe.Checkout.Session) {
  if (typeof session.payment_intent === "string") return session.payment_intent;
  return session.payment_intent?.id ?? null;
}

export function paymentIdFromSession(session: Stripe.Checkout.Session) {
  return session.metadata?.paymentId || session.client_reference_id || null;
}

export function assertSessionMatchesPayment(
  session: Stripe.Checkout.Session,
  payment: Pick<CheckoutPayment, "id" | "orderId" | "amount" | "currency">,
) {
  const expectedAmount = toMinorUnits(payment.amount, payment.currency);
  const actualCurrency = session.currency?.toUpperCase();
  const metadataOrderId = session.metadata?.orderId;

  if (
    paymentIdFromSession(session) !== payment.id ||
    metadataOrderId !== payment.orderId ||
    session.amount_total !== expectedAmount ||
    actualCurrency !== payment.currency.toUpperCase()
  ) {
    throw Object.assign(new Error("Stripe payment details do not match the payment request"), {
      status: 400,
    });
  }
}

export function transitionForCheckoutEvent(event: Stripe.Event): StripeSessionTransition {
  if (!event.type.startsWith("checkout.session.")) return { kind: "none", paymentId: null };

  const session = event.data.object as Stripe.Checkout.Session;
  const paymentId = paymentIdFromSession(session);

  if (
    (event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded") &&
    session.payment_status === "paid"
  ) {
    return {
      kind: "paid",
      paymentId,
      paymentIntentId: paymentIntentId(session),
    };
  }

  if (event.type === "checkout.session.async_payment_failed") {
    return { kind: "failed", paymentId };
  }

  if (event.type === "checkout.session.expired") {
    return { kind: "expired", paymentId };
  }

  return { kind: "none", paymentId };
}

export function verifyStripeWebhook(
  payload: Buffer | string,
  signature: string,
  secret: string,
  client: Stripe = getStripeClient(),
) {
  return client.webhooks.constructEvent(payload, signature, secret);
}
