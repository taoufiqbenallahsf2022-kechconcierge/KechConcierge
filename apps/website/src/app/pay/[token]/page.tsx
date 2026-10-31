"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:8081/api";

type PaymentItem = {
  id: string;
  productName: string;
  planName?: string | null;
};

type PaymentSummary = {
  amount: string | number;
  currency: string;
  status: string;
  paymentAvailable: boolean;
  order: {
    orderNumber: string;
    clientFirstName?: string | null;
    totalAmount: string | number;
    items: PaymentItem[];
  };
};

type PagePhase = "loading" | "ready" | "starting" | "verifying";

async function responseMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.message === "string" && body.message.trim()
    ? body.message
    : fallback;
}

function formatMoney(value: string | number, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const wasCancelled = searchParams.get("cancelled") === "1";

  const [data, setData] = useState<PaymentSummary | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<PagePhase>("loading");
  const checkoutStarting = useRef(false);
  const verification = useRef<{
    sessionId: string;
    promise: Promise<void>;
  } | null>(null);

  const fetchSummary = useCallback(async () => {
    const response = await fetch(`${API}/public/payments/${token}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        await responseMessage(response, "Unable to load this payment request."),
      );
    }

    const summary = (await response.json()) as PaymentSummary;
    setData(summary);
    return summary;
  }, [token]);

  const verifyStripeSession = useCallback(
    async (stripeSessionId: string, force = false) => {
      if (
        !force &&
        verification.current?.sessionId === stripeSessionId
      ) {
        return verification.current.promise;
      }

      const promise = (async () => {
        const response = await fetch(
          `${API}/public/payments/${token}/stripe/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: stripeSessionId }),
          },
        );

        if (!response.ok) {
          throw new Error(
            await responseMessage(
              response,
              "We could not confirm the payment with Stripe yet.",
            ),
          );
        }
      })();

      verification.current = { sessionId: stripeSessionId, promise };
      return promise;
    },
    [token],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setError("");

      if (sessionId) {
        setPhase("verifying");
        try {
          await verifyStripeSession(sessionId);
        } catch (verificationError) {
          if (active) {
            setError(
              verificationError instanceof Error
                ? verificationError.message
                : "We could not confirm the payment with Stripe yet.",
            );
          }
        }
      } else {
        setPhase("loading");
      }

      try {
        await fetchSummary();
      } catch (summaryError) {
        if (active) {
          setError(
            summaryError instanceof Error
              ? summaryError.message
              : "Unable to load this payment request.",
          );
        }
      } finally {
        if (active) setPhase("ready");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [fetchSummary, sessionId, verifyStripeSession]);

  async function openStripeCheckout() {
    if (checkoutStarting.current || phase === "starting") return;

    checkoutStarting.current = true;
    setPhase("starting");
    setError("");

    try {
      const response = await fetch(
        `${API}/public/payments/${token}/stripe`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof body?.message === "string"
            ? body.message
            : "Unable to open secure checkout.",
        );
      }

      if (typeof body?.url !== "string" || !body.url) {
        throw new Error("Stripe did not return a secure checkout link.");
      }

      window.location.assign(body.url);
    } catch (checkoutError) {
      checkoutStarting.current = false;
      setPhase("ready");
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to open secure checkout.",
      );
    }
  }

  async function retryVerification() {
    if (!sessionId || phase === "verifying") return;

    setPhase("verifying");
    setError("");
    try {
      await verifyStripeSession(sessionId, true);
      await fetchSummary();
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "We could not confirm the payment with Stripe yet.",
      );
    } finally {
      setPhase("ready");
    }
  }

  const isPaid = data?.status === "PAID";
  const canPay = Boolean(
    data?.paymentAvailable &&
      ["PENDING", "FAILED", "CANCELLED"].includes(data.status),
  );
  const isLoading = phase === "loading" && !data;
  const isStarting = phase === "starting";
  const isVerifying = phase === "verifying";

  return (
    <div className="relative isolate min-h-[72vh] overflow-hidden bg-[#fffaf7] px-4 py-10 text-zinc-950 sm:px-6 sm:py-16 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-16 -z-10 h-80 w-80 rounded-full bg-orange-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 -z-10 h-96 w-96 rounded-full bg-rose-100/60 blur-3xl" />

      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-center gap-3 sm:mb-8">
          <Image
            src="/brand/original-m-mark.png"
            alt="Moorish Concierge"
            width={52}
            height={52}
            className="h-12 w-12 object-contain"
            priority
          />
          <div>
            <p className="text-lg font-black tracking-tight">Moorish Concierge</p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
              Secure payment
            </p>
          </div>
        </div>

        <section
          aria-busy={isLoading || isVerifying || isStarting}
          className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_30px_90px_rgba(93,47,20,0.14)]"
        >
          {isLoading ? (
            <LoadingState />
          ) : !data ? (
            <UnavailableState error={error} onRetry={() => window.location.reload()} />
          ) : (
            <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
              <div className="p-6 sm:p-10 lg:p-12">
                <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3.5 py-2 text-xs font-black uppercase tracking-[0.13em] text-orange-800">
                    <LockKeyhole size={15} aria-hidden="true" />
                    Payment request
                  </span>
                  <span className="text-sm font-bold text-zinc-500">
                    Order {data.order.orderNumber}
                  </span>
                </div>

                {isPaid ? (
                  <PaidState firstName={data.order.clientFirstName} />
                ) : (
                  <>
                    <p className="text-sm font-semibold text-zinc-500">
                      Amount due now
                    </p>
                    <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-zinc-950 sm:text-5xl">
                      {formatMoney(data.amount, data.currency)}
                    </h1>
                    <p className="mt-4 max-w-lg text-base leading-7 text-zinc-600">
                      {data.order.clientFirstName
                        ? `${data.order.clientFirstName}, your`
                        : "Your"}{" "}
                      secure payment is ready. You will complete it on Stripe’s
                      encrypted checkout page.
                    </p>
                  </>
                )}

                {isVerifying && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mt-7 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950"
                  >
                    <Loader2
                      className="mt-0.5 shrink-0 animate-spin text-orange-700"
                      size={20}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-black">Confirming your payment</p>
                      <p className="mt-1 leading-6 text-orange-900/75">
                        Please keep this page open while Stripe confirms the transaction.
                      </p>
                    </div>
                  </div>
                )}

                {!isVerifying && !isPaid && wasCancelled && !sessionId && (
                  <div
                    role="status"
                    className="mt-7 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
                  >
                    <XCircle className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
                    <div>
                      <p className="font-black">Checkout cancelled</p>
                      <p className="mt-1 leading-6 text-amber-900/75">
                        You were not charged. You can return to checkout whenever you are ready.
                      </p>
                    </div>
                  </div>
                )}

                {!isVerifying && error && (
                  <div
                    role="alert"
                    className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
                  >
                    <p className="font-black">
                      {sessionId
                        ? "We could not confirm the payment"
                        : "Unable to continue to checkout"}
                    </p>
                    <p className="mt-1 leading-6 text-red-800/80">{error}</p>
                    {sessionId && (
                      <button
                        type="button"
                        onClick={retryVerification}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 font-black transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                      >
                        <RefreshCw size={16} aria-hidden="true" />
                        Check payment again
                      </button>
                    )}
                  </div>
                )}

                {!isPaid && canPay && !isVerifying && (
                  <button
                    type="button"
                    onClick={openStripeCheckout}
                    disabled={isStarting}
                    className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-zinc-950 px-7 py-4 text-base font-black text-white shadow-xl shadow-zinc-950/15 transition hover:-translate-y-0.5 hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 sm:w-auto"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                        Opening secure checkout…
                      </>
                    ) : (
                      <>
                        Pay {formatMoney(data.amount, data.currency)}
                        <ArrowRight size={20} aria-hidden="true" />
                      </>
                    )}
                  </button>
                )}

                {!isPaid && !data.paymentAvailable && !isVerifying && (
                  <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="font-black text-amber-950">
                      Online payment is temporarily unavailable.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-900/75">
                      Please contact Moorish Concierge and our team will help you complete your booking.
                    </p>
                  </div>
                )}

                {!isPaid && data.paymentAvailable && !canPay && !isVerifying && (
                  <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                    <p className="font-black text-zinc-900">
                      This payment request is no longer available.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      Please contact Moorish Concierge if you need a new payment link.
                    </p>
                  </div>
                )}

                <div className="mt-8 grid gap-3 border-t border-zinc-100 pt-7 sm:grid-cols-2">
                  <TrustItem icon={<ShieldCheck size={19} />} text="Encrypted Stripe Checkout" />
                  <TrustItem icon={<CreditCard size={19} />} text="Cards and supported wallets" />
                </div>
              </div>

              <aside className="border-t border-orange-100 bg-[#fff9f4] p-6 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
                <div className="flex items-center gap-2 text-zinc-950">
                  <ReceiptText size={20} className="text-orange-700" aria-hidden="true" />
                  <h2 className="text-lg font-black">Order summary</h2>
                </div>

                <ul className="mt-6 space-y-3" aria-label="Items in this order">
                  {data.order.items.map((item, index) => (
                    <li
                      key={item.id || `${item.productName}-${index}`}
                      className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-white p-4"
                    >
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-800">
                        <Check size={15} strokeWidth={3} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold leading-6 text-zinc-900">
                          {item.productName}
                        </p>
                        {item.planName && (
                          <p className="mt-0.5 text-sm text-zinc-500">{item.planName}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-3 border-t border-orange-200 pt-5 text-sm">
                  <div className="flex items-center justify-between gap-4 text-zinc-600">
                    <span>Full order total</span>
                    <strong className="text-zinc-900">
                      {formatMoney(data.order.totalAmount, data.currency)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-base">
                    <span className="font-black text-zinc-950">Payment due now</span>
                    <strong className="text-xl font-black text-orange-700">
                      {formatMoney(data.amount, data.currency)}
                    </strong>
                  </div>
                </div>

                <p className="mt-7 flex items-start gap-2 text-xs leading-5 text-zinc-500">
                  <LockKeyhole size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  Payment details are entered directly on Stripe and are never stored on this website.
                </p>
              </aside>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
          Need help? Contact us at{" "}
          <a
            href="mailto:contact@moorishconcierge.com"
            className="font-bold text-zinc-700 underline decoration-orange-300 underline-offset-4 hover:text-orange-700"
          >
            contact@moorishconcierge.com
          </a>
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid min-h-[520px] place-items-center p-8" role="status" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-orange-700">
          <Loader2 className="animate-spin" size={30} aria-hidden="true" />
        </span>
        <p className="mt-5 text-lg font-black">Loading your secure payment…</p>
        <p className="mt-2 text-sm text-zinc-500">This should only take a moment.</p>
      </div>
    </div>
  );
}

function UnavailableState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-[480px] place-items-center p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-700">
          <XCircle size={30} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-black tracking-tight">
          Payment request unavailable
        </h1>
        <p className="mt-3 leading-7 text-zinc-600" role="alert">
          {error || "We could not load this payment request."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 font-black text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
        >
          <RefreshCw size={17} aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}

function PaidState({ firstName }: { firstName?: string | null }) {
  return (
    <div role="status" aria-live="polite">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
        <CheckCircle2 size={34} aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
        Payment received
      </h1>
      <p className="mt-4 max-w-lg text-base leading-7 text-zinc-600">
        Thank you{firstName ? `, ${firstName}` : ""}. Your payment has been confirmed and the Moorish Concierge team can continue preparing your order.
      </p>
    </div>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm font-bold text-zinc-600">
      <span className="text-orange-700" aria-hidden="true">{icon}</span>
      {text}
    </div>
  );
}
