"use client";

import Link from "next/link";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  X,
  Mail,
  Lock,
  Loader2,
  User,
  Phone,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

type CountryOption = {
  name: string;
  flag: string;
  code: string;
};

const countryOptions: CountryOption[] = [
  { name: "Morocco", flag: "🇲🇦", code: "+212" },
  { name: "France", flag: "🇫🇷", code: "+33" },
  { name: "Spain", flag: "🇪🇸", code: "+34" },
  { name: "Portugal", flag: "🇵🇹", code: "+351" },
  { name: "Italy", flag: "🇮🇹", code: "+39" },
  { name: "Germany", flag: "🇩🇪", code: "+49" },
  { name: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { name: "United States", flag: "🇺🇸", code: "+1" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AuthModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(
    countryOptions[0]
  );
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  if (!open) return null;

  function validateForm() {
    if (mode === "signup" && !firstName.trim()) {
      return "First name is required.";
    }

    if (mode === "signup" && !lastName.trim()) {
      return "Last name is required.";
    }

    if (mode === "signup" && !mobilePhone.trim()) {
      return "Phone number is required.";
    }

    if (!email.trim() || !email.includes("@")) {
      return "Please enter a valid email address.";
    }

    if (!password || password.length < 6) {
      return "Password must contain at least 6 characters.";
    }

    if (mode === "signup" && password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  }

  async function handleClassicSignup() {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        countryCode: selectedCountry.code,
        mobilePhone: mobilePhone.trim(),
        password,
        language: "EN",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to create account.");
    }

    return data;
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

    try {
      if (mode === "signup") {
        await handleClassicSignup();

        setStatus("success");
        setMessage("");
        setVerificationEmailSent(true);
        return;
      }

      setStatus("error");
      setMessage("Classic login endpoint is not connected yet.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to connect to the API."
      );
    }
  }

  async function handleGoogleSignup(idToken: string) {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/google-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          language: "EN",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to complete Google signup.");
      }

      if (data.individual) {
        localStorage.setItem("kech_user", JSON.stringify(data.individual));
        window.dispatchEvent(new Event("kech-auth-change"));
      }

      setStatus("success");
      setMessage("Google signup completed successfully.");

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to Google signup endpoint."
      );
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setStatus("idle");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    setVerificationEmailSent(false);
    setCountryDropdownOpen(false);
  }

  function closeAndReset() {
    setStatus("idle");
    setMessage("");
    setVerificationEmailSent(false);
    setCountryDropdownOpen(false);
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4"
      onClick={() => setCountryDropdownOpen(false)}
    >
      <div
        onClick={(event) => event.stopPropagation()}
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

        <div className="mb-5 mt-6 flex w-full justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition hover:bg-orange-50">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (!credentialResponse.credential) {
                setStatus("error");
                setMessage("Google did not return an ID token.");
                return;
              }

              handleGoogleSignup(credentialResponse.credential);
            }}
            onError={() => {
              setStatus("error");
              setMessage("Google authentication failed.");
            }}
            text={mode === "login" ? "continue_with" : "signup_with"}
            shape="pill"
            width="320"
          />
        </div>

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
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <User size={18} className="text-orange-700" />
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  className="w-full outline-none"
                />
              </label>

              <div className="relative flex min-w-0 items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3">
                <Phone size={18} className="shrink-0 text-orange-700" />

                <button
                  type="button"
                  onClick={() => setCountryDropdownOpen((value) => !value)}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-orange-50 px-2 py-1 text-sm font-bold text-zinc-800"
                >
                  <span className="text-base leading-none">
                    {selectedCountry.flag}
                  </span>
                  <span>{selectedCountry.code}</span>
                  <ChevronDown size={14} className="text-orange-700" />
                </button>

                <div className="h-5 w-px shrink-0 bg-zinc-200" />

                <input
                  value={mobilePhone}
                  onChange={(event) => setMobilePhone(event.target.value)}
                  placeholder="Phone number"
                  className="min-w-0 flex-1 outline-none"
                />

                {countryDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-56 w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                    {countryOptions.map((country) => (
                      <button
                        key={`${country.name}-${country.code}`}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setCountryDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-orange-50 ${
                          selectedCountry.code === country.code
                            ? "bg-orange-50 font-bold text-orange-800"
                            : "text-zinc-700"
                        }`}
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="shrink-0 font-bold">
                          {country.code}
                        </span>
                        <span className="truncate">{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Mail size={18} className="text-orange-700" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Lock size={18} className="text-orange-700" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Lock size={18} className="text-orange-700" />
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
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
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Lock size={18} className="text-orange-700" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
            {status === "loading" && (
              <Loader2 size={18} className="animate-spin" />
            )}
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