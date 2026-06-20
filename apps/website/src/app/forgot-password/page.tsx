"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";
import { ArrowLeft, Loader2, Mail, MessageCircle, Phone } from "lucide-react";

type Step = "choose" | "email" | "other";

export default function ForgotPasswordPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);
  

  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const phoneExistsInSimulation = phone.trim().length >= 8;

  function submitEmail() {
    setStatus("loading");
    setMessage("");

    setTimeout(() => {
      if (!email.includes("@")) {
        setStatus("error");
        setMessage("Please enter a valid email address.");
        return;
      }

      setStatus("success");
      setMessage("Simulation: if this email exists, a reset link will be sent.");
    }, 900);
  }

  function submitPhone() {
    setStatus("loading");
    setMessage("");

    setTimeout(() => {
      if (!phoneExistsInSimulation) {
        setStatus("error");
        setMessage("No phone number found for this account in this simulation. Please contact support.");
        return;
      }

      setStatus("success");
      setMessage("Simulation: an SMS recovery code would be sent to this phone number.");
    }, 900);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <Link
        href={locale === "en" ? "/" : `/${locale}`}
        className="inline-flex items-center gap-2 font-black text-orange-700"
      >
        <ArrowLeft size={18} />
        {t.forgotPassword.backToWebsite}
      </Link>

      <div className="mt-8 rounded-[2rem] bg-white p-6 card-shadow md:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
          {t.forgotPassword.eyebrow}
        </p>

        <h1 className="mt-3 text-4xl font-black text-zinc-950">
          {t.forgotPassword.title}
        </h1>

        <p className="mt-4 leading-7 text-zinc-600">
          {t.forgotPassword.description}
        </p>

        {step === "choose" && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              onClick={() => {
                setStep("email");
                setStatus("idle");
                setMessage("");
              }}
              className="rounded-3xl border border-orange-100 bg-orange-50 p-6 text-left transition hover:bg-orange-100"
            >
              <Mail className="text-orange-700" />

              <p className="mt-4 text-xl font-black text-zinc-950">
                {t.forgotPassword.restoreEmail}
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {t.forgotPassword.restoreEmailDescription}
              </p>
            </button>

            <button
              onClick={() => {
                setStep("other");
                setStatus("idle");
                setMessage("");
              }}
              className="rounded-3xl border border-zinc-200 bg-white p-6 text-left transition hover:bg-orange-50"
            >
              <Phone className="text-orange-700" />

              <p className="mt-4 text-xl font-black text-zinc-950">
                {t.forgotPassword.restoreOther}
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {t.forgotPassword.restoreOtherDescription}
              </p>
            </button>
          </div>
        )}

        {step === "email" && (
          <div className="mt-8">
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
              <Mail size={18} className="text-orange-700" />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.forgotPassword.emailAddress}
                className="w-full outline-none"
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={submitEmail}
                disabled={status === "loading"}
                className="flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
              >
                {status === "loading" && (
                  <Loader2 size={18} className="animate-spin" />
                )}
                {t.forgotPassword.sendResetLink}
              </button>

              <button
                onClick={() => setStep("choose")}
                className="rounded-full border border-zinc-200 px-7 py-4 font-black text-zinc-800"
              >
                {t.forgotPassword.back}
              </button>
            </div>
          </div>
        )}

        {step === "other" && (
          <div className="mt-8 space-y-5">
            <div className="rounded-3xl bg-orange-50 p-5">
              <p className="font-black text-zinc-950">
                {t.forgotPassword.recoverByPhone}
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {t.forgotPassword.recoverByPhoneDescription}
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.forgotPassword.phoneNumber}
                  className="flex-1 rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
                />

                <button
                  onClick={submitPhone}
                  disabled={status === "loading"}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
                >
                  {status === "loading" && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {t.forgotPassword.sendSms}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <p className="font-black text-zinc-950">
                {t.forgotPassword.contactSupport}
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {t.forgotPassword.contactSupportDescription}
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={locale === "en" ? "/contact" : `/${locale}/contact`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 font-black text-white transition hover:bg-orange-700"
                >
                  <MessageCircle size={18} />
                  {t.forgotPassword.contactPage}
                </Link>

                <a
                  href="https://wa.me/212600000000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-green-50 px-6 py-3 font-black text-green-700 transition hover:bg-green-100"
                >
                  {t.forgotPassword.whatsapp}
                </a>
              </div>
            </div>

            <button
              onClick={() => setStep("choose")}
              className="rounded-full border border-zinc-200 px-7 py-4 font-black text-zinc-800"
            >
              {t.forgotPassword.back}
            </button>
          </div>
        )}

        {message && (
          <div
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