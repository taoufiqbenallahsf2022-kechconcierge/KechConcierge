"use client";

import Link from "next/link";
import { useState } from "react";
import { X, Mail, Lock, Loader2, User, Phone, CheckCircle2 } from "lucide-react";

type Props = { open: boolean; onClose: () => void };

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function AuthModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  if (!open) return null;

  function validateForm() {
    if (mode === "signup" && !firstName.trim()) return "First name is required.";
    if (mode === "signup" && !lastName.trim()) return "Last name is required.";
    if (!email.includes("@")) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must contain at least 6 characters.";
    if (mode === "signup" && password !== confirmPassword) return "Passwords do not match.";
    return "";
  }

  async function handleSubmit() {
    const error = validateForm();

    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }

    setStatus("loading");
    setMessage("");

    setTimeout(() => {
      if (mode === "signup") {
        setStatus("success");
        setMessage("");
        setVerificationEmailSent(true);
        return;
      }

      const user = {
        firstName: "Taoufiq",
        lastName: "Benallah",
        email,
        mobilePhone,
      };

      localStorage.setItem("kech_user", JSON.stringify(user));
      window.dispatchEvent(new Event("kech-auth-change"));

      setStatus("success");
      setMessage("Logged in successfully.");

      setTimeout(onClose, 700);
    }, 700);
  }

  function handleGoogleAuth() {
    setStatus("loading");
    setMessage("");

    setTimeout(() => {
      setStatus("success");
      setMessage("Google authentication will be connected later.");
    }, 700);
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setStatus("idle");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    setVerificationEmailSent(false);
  }

  function closeAndReset() {
    setStatus("idle");
    setMessage("");
    setVerificationEmailSent(false);
    onClose();
  }

  if (verificationEmailSent) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4">
        <div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center card-shadow">
          <button
            onClick={closeAndReset}
            className="absolute right-4 top-4 rounded-full bg-orange-50 p-2 text-orange-800"
          >
            <X size={18} />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
            <CheckCircle2 size={30} />
          </div>

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-orange-700">
            Kech Concierge
          </p>

          <h2 className="mt-3 text-2xl font-black text-zinc-950">
            Check your email
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-600">
            We sent a verification link to{" "}
            <span className="font-bold text-zinc-900">{email}</span>. Please
            open your inbox and verify your account before logging in.
          </p>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            If you do not see the email, check your spam or promotions folder.
          </p>

          <button
            onClick={() => {
              setVerificationEmailSent(false);
              setMode("login");
              setStatus("idle");
              setMessage("");
              setPassword("");
              setConfirmPassword("");
            }}
            className="mt-6 w-full rounded-2xl bg-orange-600 px-5 py-3 font-black text-white transition hover:bg-orange-700"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4">
      <div
        className={`relative w-full rounded-3xl bg-white p-6 card-shadow transition-all ${
          mode === "signup" ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <button
          onClick={closeAndReset}
          className="absolute right-4 top-4 rounded-full bg-orange-50 p-2 text-orange-800"
        >
          <X size={18} />
        </button>

        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-700">
          Kech Concierge
        </p>

        <h2 className="mt-2 text-2xl font-black text-zinc-950">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>

        <p className="mt-2 text-sm text-zinc-600">
          {mode === "login"
            ? "Login to manage your requests and conversations."
            : "Create an account. We will send you an email to verify your account before activation."}
        </p>

        <button
          onClick={handleGoogleAuth}
          disabled={status === "loading"}
          className="mb-5 mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-bold text-zinc-800 transition hover:bg-orange-50 disabled:opacity-70"
        >
          <GoogleIcon />
          {mode === "login" ? "Continue with Google" : "Sign up with Google"}
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
            OR
          </span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <div className="space-y-3">
          {mode === "signup" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <User size={18} className="text-orange-700" />
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <User size={18} className="text-orange-700" />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Mail size={18} className="text-orange-700" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full outline-none"
                />
              </label>
              
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Phone size={18} className="text-orange-700" />
                <input
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full outline-none"
                />
              </label>


              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Lock size={18} className="text-orange-700" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Lock size={18} className="text-orange-700" />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  type="password"
                  className="w-full outline-none"
                />
              </label>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Mail size={18} className="text-orange-700" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Lock size={18} className="text-orange-700" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  className="w-full outline-none"
                />
              </label>

              <div className="text-right">
                <Link
                  href="/forgot-password"
                  onClick={closeAndReset}
                  className="text-sm font-black text-orange-700 hover:text-orange-800"
                >
                  Forgot password?
                </Link>
              </div>
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={status === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
          >
            {status === "loading" && <Loader2 size={18} className="animate-spin" />}
            {mode === "login" ? "Login" : "Send verification email"}
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
              status === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <p className="mt-5 text-center text-sm text-zinc-600">
          {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
          <button onClick={switchMode} className="font-black text-orange-700">
            {mode === "login" ? "Create one" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}