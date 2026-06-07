"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail, MessageCircle, Phone } from "lucide-react";

type Step = "choose" | "email" | "other";

export default function ForgotPasswordPage() {
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
      <Link href="/" className="inline-flex items-center gap-2 font-black text-orange-700">
        <ArrowLeft size={18} />
        Back to website
      </Link>

      <div className="mt-8 rounded-[2rem] bg-white p-6 card-shadow md:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
          Account recovery
        </p>

        <h1 className="mt-3 text-4xl font-black text-zinc-950">
          Forgot your password?
        </h1>

        <p className="mt-4 leading-7 text-zinc-600">
          This is a frontend simulation. Later your API will verify the email,
          phone number, and send the recovery link or SMS.
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
                Restore using email
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Enter your email address and receive a reset link.
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
                Restore another way
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Use phone recovery or contact support.
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
                placeholder="Email address"
                className="w-full outline-none"
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={submitEmail}
                disabled={status === "loading"}
                className="flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
              >
                {status === "loading" && <Loader2 size={18} className="animate-spin" />}
                Send reset link
              </button>

              <button
                onClick={() => setStep("choose")}
                className="rounded-full border border-zinc-200 px-7 py-4 font-black text-zinc-800"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === "other" && (
          <div className="mt-8 space-y-5">
            <div className="rounded-3xl bg-orange-50 p-5">
              <p className="font-black text-zinc-950">Recover by phone</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                In the real backend, this option will only appear if the user has a phone number.
                For this frontend simulation, enter a phone number to test it.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="flex-1 rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
                />

                <button
                  onClick={submitPhone}
                  disabled={status === "loading"}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
                >
                  {status === "loading" && <Loader2 size={18} className="animate-spin" />}
                  Send SMS
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5">
              <p className="font-black text-zinc-950">Contact support</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                If you forgot your email and cannot recover by phone, contact our support team.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 font-black text-white transition hover:bg-orange-700"
                >
                  <MessageCircle size={18} />
                  Contact page
                </Link>

                <a
                  href="https://wa.me/212600000000"
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-green-50 px-6 py-3 font-black text-green-700 transition hover:bg-green-100"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <button
              onClick={() => setStep("choose")}
              className="rounded-full border border-zinc-200 px-7 py-4 font-black text-zinc-800"
            >
              Back
            </button>
          </div>
        )}

        {message && (
          <div
            className={`mt-6 rounded-2xl px-4 py-3 font-semibold ${
              status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </section>
  );
}