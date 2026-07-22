"use client";

import Link from "next/link";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  useState,
} from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

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

export default function ResetPasswordPage() {
  const pathname = usePathname();

  const searchParams =
    useSearchParams();

  const locale =
    getLocaleFromPath(pathname);

  const t =
    getDictionary(locale);

  const token =
    searchParams.get("token") || "";

  const [password, setPassword] =
    useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmation,
    setShowConfirmation,
  ] = useState(false);

  const [status, setStatus] =
    useState<Status>("idle");

  const [message, setMessage] =
    useState("");

  const loginPath =
    locale === "en"
      ? "/"
      : `/${locale}`;

  function resetFeedback() {
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  }

  async function submit() {
    if (!token) {
      setStatus("error");

      setMessage(
        t.resetPassword
          .invalidToken
      );

      return;
    }

    if (password.length < 8) {
      setStatus("error");

      setMessage(
        t.resetPassword
          .passwordTooShort
      );

      return;
    }

    if (
      password !==
      passwordConfirmation
    ) {
      setStatus("error");

      setMessage(
        t.resetPassword
          .passwordsDoNotMatch
      );

      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/password/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            token,
            password,
            passwordConfirmation,
          }),
        }
      );

      const data =
        (await response.json()) as
          ApiResponse;

      if (!response.ok) {
        if (
          data.code ===
          "ERROR_RESET_TOKEN_INVALID_OR_EXPIRED"
        ) {
          throw new Error(
            t.resetPassword
              .invalidOrExpired
          );
        }

        throw new Error(
          data.message ||
            data.code ||
            t.resetPassword
              .genericError
        );
      }

      setStatus("success");

      setMessage(
        t.resetPassword.success
      );

      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      console.error(
        "Unable to reset password:",
        error
      );

      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : t.resetPassword
              .genericError
      );
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-20">
      <Link
        href={loginPath}
        className="inline-flex items-center gap-2 font-black text-orange-700"
      >
        <ArrowLeft size={18} />

        {
          t.resetPassword
            .backToWebsite
        }
      </Link>

      <div className="mt-8 rounded-[2rem] bg-white p-6 card-shadow md:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
          {
            t.resetPassword
              .eyebrow
          }
        </p>

        <h1 className="mt-3 text-4xl font-black text-zinc-950">
          {
            t.resetPassword
              .title
          }
        </h1>

        <p className="mt-4 leading-7 text-zinc-600">
          {
            t.resetPassword
              .description
          }
        </p>

        {!token && (
          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-700">
            {
              t.resetPassword
                .invalidToken
            }
          </div>
        )}

        {token &&
          status !== "success" && (
          <div className="mt-8 space-y-4">
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 focus-within:border-orange-400">
              <KeyRound
                size={18}
                className="shrink-0 text-orange-700"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  resetFeedback();
                }}
                placeholder={
                  t.resetPassword
                    .newPassword
                }
                autoComplete="new-password"
                disabled={
                  status === "loading"
                }
                className="w-full outline-none disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                className="text-zinc-500"
                aria-label={
                  showPassword
                    ? t.resetPassword
                        .hidePassword
                    : t.resetPassword
                        .showPassword
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 focus-within:border-orange-400">
              <KeyRound
                size={18}
                className="shrink-0 text-orange-700"
              />

              <input
                type={
                  showConfirmation
                    ? "text"
                    : "password"
                }
                value={
                  passwordConfirmation
                }
                onChange={(event) => {
                  setPasswordConfirmation(
                    event.target.value
                  );

                  resetFeedback();
                }}
                placeholder={
                  t.resetPassword
                    .confirmPassword
                }
                autoComplete="new-password"
                disabled={
                  status === "loading"
                }
                className="w-full outline-none disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmation(
                    (current) =>
                      !current
                  )
                }
                className="text-zinc-500"
                aria-label={
                  showConfirmation
                    ? t.resetPassword
                        .hidePassword
                    : t.resetPassword
                        .showPassword
                }
              >
                {showConfirmation ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </label>

            <p className="text-sm text-zinc-500">
              {
                t.resetPassword
                  .passwordRequirement
              }
            </p>

            <button
              type="button"
              onClick={submit}
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
                ? t.resetPassword
                    .updating
                : t.resetPassword
                    .submit}
            </button>
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

        {status === "success" && (
          <Link
            href={loginPath}
            className="mt-6 inline-flex rounded-full bg-zinc-950 px-7 py-3 font-black text-white transition hover:bg-orange-700"
          >
            {
              t.resetPassword
                .returnToLogin
            }
          </Link>
        )}
      </div>
    </section>
  );
}