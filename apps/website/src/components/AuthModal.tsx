"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import countries from "i18n-iso-countries";
import enCountries from "i18n-iso-countries/langs/en.json";
import {
  X,
  Mail,
  Lock,
  Loader2,
  User,
  Phone,
  CheckCircle2,
  ChevronDown,
  Globe2,
  Languages,
} from "lucide-react";

import { useAuthStore } from "../store/auth.store";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";

countries.registerLocale(enCountries);

type Props = {
  open: boolean;
  onClose: () => void;
};

type CountryOption = {
  name: string;
  alpha2: string;
  alpha3: string;
  flag: string;
};

type PhoneCountryOption = {
  name: string;
  flag: string;
  code: string;
};

type LanguageOption = {
  label: string;
  code: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const phoneCountryOptions: PhoneCountryOption[] = [
  { name: "Morocco", flag: "🇲🇦", code: "+212" },
  { name: "France", flag: "🇫🇷", code: "+33" },
  { name: "Spain", flag: "🇪🇸", code: "+34" },
  { name: "Portugal", flag: "🇵🇹", code: "+351" },
  { name: "Italy", flag: "🇮🇹", code: "+39" },
  { name: "Germany", flag: "🇩🇪", code: "+49" },
  { name: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { name: "United States", flag: "🇺🇸", code: "+1" },
];

const languageOptions: LanguageOption[] = [
  { label: "English", code: "en" },
  { label: "French", code: "fr" },
  { label: "Spanish", code: "es" },
  { label: "German", code: "de" },
  { label: "Portuguese", code: "pt" },
  { label: "Italian", code: "it" },
];

function getFlagEmoji(alpha2: string) {
  return alpha2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function getAllCountryOptions(): CountryOption[] {
  const names = countries.getNames("en", { select: "official" });

  return Object.entries(names)
    .map(([alpha2, name]) => {
      const alpha3 = countries.alpha2ToAlpha3(alpha2);

      if (!alpha3) return null;

      return {
        name,
        alpha2,
        alpha3,
        flag: getFlagEmoji(alpha2),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name)) as CountryOption[];
}

export default function AuthModal({ open, onClose }: Props) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  const countryOptions = useMemo(() => getAllCountryOptions(), []);

  const defaultCountry =
    countryOptions.find((country) => country.alpha3 === "MAR") ||
    countryOptions[0];

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [selectedPhoneCountry, setSelectedPhoneCountry] =
    useState<PhoneCountryOption>(phoneCountryOptions[0]);
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [mobilePhone, setMobilePhone] = useState("");

  const [selectedCountry, setSelectedCountry] =
    useState<CountryOption>(defaultCountry);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(
    languageOptions.find((language) => language.code === locale) ||
      languageOptions[0]
  );
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  const login = useAuthStore((state) => state.login);

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();

    if (!search) return countryOptions;

    return countryOptions.filter(
      (country) =>
        country.name.toLowerCase().includes(search) ||
        country.alpha3.toLowerCase().includes(search)
    );
  }, [countryOptions, countrySearch]);

  if (!open) return null;

  function closeDropdowns() {
    setPhoneDropdownOpen(false);
    setCountryDropdownOpen(false);
    setLanguageDropdownOpen(false);
  }

  function validateForm() {
    if (mode === "signup" && !firstName.trim()) {
      return t.authModal.firstName + " is required.";
    }

    if (mode === "signup" && !lastName.trim()) {
      return t.authModal.lastName + " is required.";
    }

    if (mode === "signup" && !mobilePhone.trim()) {
      return t.authModal.phoneNumber + " is required.";
    }

    if (mode === "signup" && !selectedCountry?.alpha3) {
      return t.authModal.country + " is required.";
    }

    if (mode === "signup" && !selectedLanguage?.code) {
      return t.authModal.preferredLanguage + " is required.";
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
        const response = await fetch(`${API_URL}/api/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            countryCode: selectedPhoneCountry.code,
            mobilePhone: mobilePhone.trim(),
            country: selectedCountry.alpha3,
            language: selectedLanguage.code,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.message || data.code || "Unable to create account.");
          return;
        }

        setStatus("success");
        setMessage("");
        setVerificationEmailSent(true);
        return;
      }

      if (mode === "login") {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.code || data.message || "Unable to login.");
          return;
        }

        login(data.individual, data.accessToken);

        setStatus("success");
        setMessage(t.authModal.loggedInSuccessfully);

        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to connect to the API."
      );
    }
  }

  async function handleGoogleAuth(idToken: string) {
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
          country: selectedCountry.alpha3,
          language: selectedLanguage.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to complete Google authentication."
        );
      }

      if (data.individual) login(data.individual, data.accessToken);

      setStatus("success");
      setMessage(t.authModal.googleAuthSuccess);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to Google authentication endpoint."
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
    closeDropdowns();
  }

  function closeAndReset() {
    setStatus("idle");
    setMessage("");
    setVerificationEmailSent(false);
    closeDropdowns();
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
            {t.authModal.brand}
          </p>

          <h2 className="mt-3 text-2xl font-black text-zinc-950">
            {t.authModal.checkEmail}
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {t.authModal.verificationSentPrefix}{" "}
            <span className="font-bold text-zinc-900">{email}</span>.{" "}
            {t.authModal.verificationSentSuffix}
          </p>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            {t.authModal.spamMessage}
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
            {t.authModal.backToLogin}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4"
      onClick={closeDropdowns}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative w-full rounded-3xl bg-white p-6 card-shadow transition-all ${
          mode === "signup" ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <button
          onClick={closeAndReset}
          className="absolute right-4 top-4 rounded-full bg-orange-50 p-2 text-orange-800"
        >
          <X size={18} />
        </button>

        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-700">
          {t.authModal.brand}
        </p>

        <h2 className="mt-2 text-2xl font-black text-zinc-950">
          {mode === "login"
            ? t.authModal.welcomeBack
            : t.authModal.createAccount}
        </h2>

        <p className="mt-2 text-sm text-zinc-600">
          {mode === "login"
            ? t.authModal.loginDescription
            : t.authModal.signupDescription}
        </p>

        <div className="mb-5 mt-6 flex w-full justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition hover:bg-orange-50">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (!credentialResponse.credential) {
                setStatus("error");
                setMessage(t.authModal.googleNoToken);
                return;
              }

              handleGoogleAuth(credentialResponse.credential);
            }}
            onError={() => {
              setStatus("error");
              setMessage(t.authModal.googleFailed);
            }}
            text={mode === "login" ? "continue_with" : "signup_with"}
            shape="pill"
            width="320"
          />
        </div>

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
            {t.authModal.or}
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
                  placeholder={t.authModal.firstName}
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <User size={18} className="text-orange-700" />
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder={t.authModal.lastName}
                  className="w-full outline-none"
                />
              </label>

              <div className="relative flex min-w-0 items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3">
                <Phone size={18} className="shrink-0 text-orange-700" />

                <button
                  type="button"
                  onClick={() => {
                    setPhoneDropdownOpen((value) => !value);
                    setCountryDropdownOpen(false);
                    setLanguageDropdownOpen(false);
                  }}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-orange-50 px-2 py-1 text-sm font-bold text-zinc-800"
                >
                  <span className="text-base leading-none">
                    {selectedPhoneCountry.flag}
                  </span>
                  <span>{selectedPhoneCountry.code}</span>
                  <ChevronDown size={14} className="text-orange-700" />
                </button>

                <div className="h-5 w-px shrink-0 bg-zinc-200" />

                <input
                  value={mobilePhone}
                  onChange={(event) => setMobilePhone(event.target.value)}
                  placeholder={t.authModal.phoneNumber}
                  className="min-w-0 flex-1 outline-none"
                />

                {phoneDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-56 w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                    {phoneCountryOptions.map((country) => (
                      <button
                        key={`${country.name}-${country.code}`}
                        type="button"
                        onClick={() => {
                          setSelectedPhoneCountry(country);
                          setPhoneDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-orange-50 ${
                          selectedPhoneCountry.code === country.code
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
                  placeholder={t.authModal.emailAddress}
                  className="w-full outline-none"
                />
              </label>

              <div className="relative flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Globe2 size={18} className="shrink-0 text-orange-700" />

                <button
                  type="button"
                  onClick={() => {
                    setCountryDropdownOpen((value) => !value);
                    setPhoneDropdownOpen(false);
                    setLanguageDropdownOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                >
                  <span className="min-w-0 truncate">
                    <span className="mr-2">{selectedCountry.flag}</span>
                    <span className="font-semibold text-zinc-800">
                      {selectedCountry.name}
                    </span>
                    <span className="ml-2 text-xs font-bold text-zinc-400">
                      {selectedCountry.alpha3}
                    </span>
                  </span>
                  <ChevronDown size={16} className="shrink-0 text-orange-700" />
                </button>

                {countryDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-72 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                    <input
                      value={countrySearch}
                      onChange={(event) => setCountrySearch(event.target.value)}
                      placeholder={t.authModal.searchCountry}
                      className="mb-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none"
                    />

                    <div className="max-h-56 overflow-y-auto">
                      {filteredCountries.map((country) => (
                        <button
                          key={country.alpha3}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setCountryDropdownOpen(false);
                            setCountrySearch("");
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-orange-50 ${
                            selectedCountry.alpha3 === country.alpha3
                              ? "bg-orange-50 font-bold text-orange-800"
                              : "text-zinc-700"
                          }`}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="min-w-0 flex-1 truncate">
                            {country.name}
                          </span>
                          <span className="shrink-0 text-xs font-bold text-zinc-400">
                            {country.alpha3}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Languages size={18} className="shrink-0 text-orange-700" />

                <button
                  type="button"
                  onClick={() => {
                    setLanguageDropdownOpen((value) => !value);
                    setPhoneDropdownOpen(false);
                    setCountryDropdownOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-semibold text-zinc-800">
                      {selectedLanguage.label}
                    </span>
                    <span className="ml-2 text-xs font-bold uppercase text-zinc-400">
                      {selectedLanguage.code}
                    </span>
                  </span>
                  <ChevronDown size={16} className="shrink-0 text-orange-700" />
                </button>

                {languageDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                    {languageOptions.map((language) => (
                      <button
                        key={language.code}
                        type="button"
                        onClick={() => {
                          setSelectedLanguage(language);
                          setLanguageDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-orange-50 ${
                          selectedLanguage.code === language.code
                            ? "bg-orange-50 font-bold text-orange-800"
                            : "text-zinc-700"
                        }`}
                      >
                        <span>{language.label}</span>
                        <span className="text-xs font-bold uppercase text-zinc-400">
                          {language.code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Lock size={18} className="text-orange-700" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.authModal.password}
                  type="password"
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Lock size={18} className="text-orange-700" />
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={t.authModal.confirmPassword}
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
                  placeholder={t.authModal.emailAddress}
                  className="w-full outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
                <Lock size={18} className="text-orange-700" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.authModal.password}
                  type="password"
                  className="w-full outline-none"
                />
              </label>

              <div className="text-right">
                <Link
                  href={locale === "en" ? "/forgot-password" : `/${locale}/forgot-password`}
                  onClick={closeAndReset}
                  className="text-sm font-black text-orange-700 hover:text-orange-800"
                >
                  {t.authModal.forgotPassword}
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
            {mode === "login" ? t.authModal.login : t.authModal.signup}
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
          {mode === "login"
            ? t.authModal.noAccountYet
            : t.authModal.alreadyHaveAccount}{" "}
          <button onClick={switchMode} className="font-black text-orange-700">
            {mode === "login" ? t.authModal.createOne : t.authModal.login}
          </button>
        </p>
      </div>
    </div>
  );
}