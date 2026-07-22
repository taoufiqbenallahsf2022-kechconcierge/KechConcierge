"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  useState,
} from "react";

import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

type Step =
  | "choose"
  | "email";

type Status =
  | "idle"
  | "loading"
  | "success"
  | "error";

type ApiResponse = {
  code?: string;
  message?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export default function ForgotPasswordPage() {
  const pathname = usePathname();

  const locale =
    getLocaleFromPath(pathname);

  const t =
    getDictionary(locale);

  const [step, setStep] =
    useState<Step>("choose");

  const [email, setEmail] =
    useState("");

  const [status, setStatus] =
    useState<Status>("idle");

  const [message, setMessage] =
    useState("");

  function resetFeedback() {
    setStatus("idle");
    setMessage("");
  }

  async function submitEmail() {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      setStatus("error");

      setMessage(
        t.forgotPassword.invalidEmail
      );

      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/password/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            email: normalizedEmail,
            language:
              locale.toUpperCase(),
          }),
        }
      );

      const data =
        (await response.json()) as {
          code?: string;
          message?: string;
        };

      if (!response.ok) {
        if (
          data.code ===
          "ERROR_EMAIL_NOT_FOUND"
        ) {
          throw new Error(
            t.forgotPassword.emailNotFound
          );
        }

        if (
          data.code ===
          "ERROR_ACCOUNT_USES_EXTERNAL_PROVIDER"
        ) {
          throw new Error(
            t.forgotPassword
              .externalProviderAccount
          );
        }

        if (
          data.code ===
          "ERROR_PASSWORD_RESET_NOT_AVAILABLE"
        ) {
          throw new Error(
            t.forgotPassword
              .resetNotAvailable
          );
        }

        throw new Error(
          t.forgotPassword.genericError
        );
      }

      setStatus("success");

      setMessage(
        t.forgotPassword.emailSent
      );
    } catch (error) {
      console.error(
        "Unable to request password reset:",
        error
      );

      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : t.forgotPassword.genericError
      );
    }
  }

  const homePath =
    locale === "en"
      ? "/"
      : `/${locale}`;

  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <Link
        href={homePath}
        className="inline-flex items-center gap-2 font-black text-orange-700"
      >
        <ArrowLeft size={18} />

        {
          t.forgotPassword
            .backToWebsite
        }
      </Link>

      <div className="mt-8 rounded-[2rem] bg-white p-6 card-shadow md:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
          {
            t.forgotPassword
              .eyebrow
          }
        </p>

        <h1 className="mt-3 text-4xl font-black text-zinc-950">
          {
            t.forgotPassword
              .title
          }
        </h1>

        <p className="mt-4 leading-7 text-zinc-600">
          {
            t.forgotPassword
              .description
          }
        </p>

        {step === "choose" && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                resetFeedback();
              }}
              className="rounded-3xl border border-orange-100 bg-orange-50 p-6 text-left transition hover:bg-orange-100"
            >
              <Mail className="text-orange-700" />

              <p className="mt-4 text-xl font-black text-zinc-950">
                {
                  t.forgotPassword
                    .restoreEmail
                }
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {
                  t.forgotPassword
                    .restoreEmailDescription
                }
              </p>
            </button>

            <div className="group relative">
              <button
                type="button"
                disabled
                className="h-full w-full cursor-not-allowed rounded-3xl border border-zinc-200 bg-zinc-100 p-6 text-left opacity-60"
              >
                <Phone className="text-zinc-500" />

                <p className="mt-4 text-xl font-black text-zinc-700">
                  {
                    t.forgotPassword
                      .restoreOther
                  }
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {
                    t.forgotPassword
                      .restoreOtherDescription
                  }
                </p>
              </button>

              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 hidden w-64 -translate-x-1/2 rounded-xl bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white shadow-xl group-hover:block">
                {
                  t.forgotPassword
                    .optionUnavailable
                }
              </div>
            </div>
          </div>
        )}

        {step === "email" && (
          <div className="mt-8">
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 focus-within:border-orange-400">
              <Mail
                size={18}
                className="text-orange-700"
              />

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );

                  resetFeedback();
                }}
                placeholder={
                  t.forgotPassword
                    .emailAddress
                }
                disabled={
                  status === "loading"
                }
                className="w-full outline-none disabled:cursor-not-allowed"
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={submitEmail}
                disabled={
                  status === "loading"
                }
                className="flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-3 font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status ===
                  "loading" && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                )}

                {status ===
                "loading"
                  ? t.forgotPassword
                      .sending
                  : t.forgotPassword
                      .sendResetLink}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("choose");
                  resetFeedback();
                }}
                disabled={
                  status === "loading"
                }
                className="rounded-full border border-zinc-200 px-7 py-3 font-black text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {
                  t.forgotPassword
                    .back
                }
              </button>
            </div>
          </div>
        )}

        {message && (
          <div
            role="status"
            className={`mt-6 rounded-2xl px-4 py-3 font-semibold ${
              status === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </section>
  );
}