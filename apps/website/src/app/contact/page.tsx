"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

import { useAuthStore } from "@/store/auth.store";

type RequestType =
  | "ADVISOR_GUIDE"
  | "COMPLAINT"
  | "SUPPORT"
  | "PARTNERSHIP"
  | "OTHER";

type ContactForm = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  countryIso: string;
  phone: string;
  requestType: RequestType | "";
  subject: string;
  message: string;
};

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

const REQUEST_TYPES: RequestType[] = [
  "ADVISOR_GUIDE",
  "COMPLAINT",
  "SUPPORT",
  "PARTNERSHIP",
  "OTHER",
];

const countryCodes = [
  { iso: "fr", country: "FR", code: "+33" },
  { iso: "es", country: "ES", code: "+34" },
  { iso: "gb", country: "GB", code: "+44" },
  { iso: "pt", country: "PT", code: "+351" },
  { iso: "it", country: "IT", code: "+39" },
  { iso: "de", country: "DE", code: "+49" },
  { iso: "ma", country: "MA", code: "+212" },
  { iso: "us", country: "US", code: "+1" },
  { iso: "ca", country: "CA", code: "+1" },
  { iso: "be", country: "BE", code: "+32" },
  { iso: "ch", country: "CH", code: "+41" },
  { iso: "nl", country: "NL", code: "+31" },
  { iso: "dz", country: "DZ", code: "+213" },
  { iso: "tn", country: "TN", code: "+216" },
  { iso: "eg", country: "EG", code: "+20" },
  { iso: "ae", country: "AE", code: "+971" },
  { iso: "sa", country: "SA", code: "+966" },
  { iso: "qa", country: "QA", code: "+974" },
  { iso: "tr", country: "TR", code: "+90" },
  { iso: "br", country: "BR", code: "+55" },
  { iso: "cn", country: "CN", code: "+86" },
  { iso: "in", country: "IN", code: "+91" },
] as const;

const initialForm: ContactForm = {
  firstName: "",
  lastName: "",
  email: "",
  countryCode: "",
  countryIso: "",
  phone: "",
  requestType: "",
  subject: "",
  message: "",
};

export default function ContactPage() {

  const accessToken = useAuthStore(
    (state) => state.accessToken
  );

  const pathname = usePathname();

  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  const [countryOpen, setCountryOpen] =
    useState(false);

  const [form, setForm] =
    useState<ContactForm>(initialForm);

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [feedback, setFeedback] =
    useState("");

  const countryNames = useMemo(
    () =>
      new Intl.DisplayNames([locale], {
        type: "region",
      }),
    [locale]
  );

  const selectedCountry =
    countryCodes.find(
      (country) =>
        country.iso === form.countryIso &&
        country.code === form.countryCode
    );

  function update(
    field: keyof ContactForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (status !== "idle") {
      setStatus("idle");
      setFeedback("");
    }
  }

  function selectCountry(
    country: (typeof countryCodes)[number]
  ) {
    setForm((current) => ({
      ...current,
      countryIso: country.iso,
      countryCode: country.code,
    }));

    setCountryOpen(false);
  }

  function validateForm() {
    if (!form.firstName.trim()) {
      return t.contactPage.validation.firstName;
    }

    if (!form.lastName.trim()) {
      return t.contactPage.validation.lastName;
    }

    if (!form.email.trim()) {
      return t.contactPage.validation.email;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return t.contactPage.validation.invalidEmail;
    }

    if (
      form.phone.trim() &&
      !form.countryCode.trim()
    ) {
      return t.contactPage.validation.countryCode;
    }

    if (
      form.countryCode.trim() &&
      !form.phone.trim()
    ) {
      return t.contactPage.validation.phone;
    }

    if (!form.requestType) {
      return t.contactPage.validation.requestType;
    }

    if (!form.message.trim()) {
      return t.contactPage.validation.comment;
    }

    return "";
  }

  async function submit() {
    const validationError = validateForm();

    if (validationError) {
      setStatus("error");
      setFeedback(validationError);
      return;
    }

    setStatus("loading");
    setFeedback("");

    const mobilePhone =
      form.phone.trim() && form.countryCode
        ? `${form.countryCode}${form.phone
            .replace(/\s+/g, "")
            .replace(/^0+/, "")}`
        : null;

    try {
      const response = await fetch(
        `${API_URL}/api/contact-requests`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
          },

          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            mobilePhone,
            requestType: form.requestType,
            subject:
              form.subject.trim() || null,
            comment: form.message.trim(),
          }),
        }
      );

      const data =
        (await response.json()) as ApiErrorResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.code ||
            t.contactPage.genericError
        );
      }

      setStatus("success");
      setFeedback(t.contactPage.success);
      setForm(initialForm);
      setCountryOpen(false);
    } catch (error) {
      console.error(
        "Unable to send contact request:",
        error
      );

      setStatus("error");

      setFeedback(
        error instanceof Error
          ? error.message
          : t.contactPage.genericError
      );
    }
  }

  

  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
          {t.contactPage.eyebrow}
        </p>

        <h1 className="mt-3 text-5xl font-black text-zinc-950">
          {t.contactPage.title}
        </h1>

        <p className="mt-5 text-lg leading-8 text-zinc-700">
          {t.contactPage.description}
        </p>

        <div className="mt-8 rounded-3xl bg-zinc-950 p-6 text-white">
          <p className="font-black">
            {t.contactPage.otherOptions}
          </p>

          <p className="mt-3 text-zinc-300">
            {t.contactPage.whatsapp}: +212 600 000 000
          </p>

          <p className="text-zinc-300">
            {t.contactPage.emailLabel}: contact@kechconcierge.local
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 card-shadow md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.firstName}
            onChange={(event) =>
              update(
                "firstName",
                event.target.value
              )
            }
            placeholder={t.contactPage.firstName}
            autoComplete="given-name"
            disabled={status === "loading"}
            className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
          />

          <input
            value={form.lastName}
            onChange={(event) =>
              update(
                "lastName",
                event.target.value
              )
            }
            placeholder={t.contactPage.lastName}
            autoComplete="family-name"
            disabled={status === "loading"}
            className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
          />

          <div className="md:col-span-2">
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                update(
                  "email",
                  event.target.value
                )
              }
              placeholder={t.contactPage.email}
              autoComplete="email"
              disabled={status === "loading"}
              className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
            />
          </div>

          <div className="md:col-span-2">
            <div className="grid gap-3 md:grid-cols-[180px_1fr]">
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setCountryOpen(
                      (current) => !current
                    )
                  }
                  disabled={status === "loading"}
                  className="flex h-[50px] w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 disabled:cursor-not-allowed disabled:bg-zinc-50"
                >
                  {selectedCountry ? (
                    <span className="flex items-center gap-2 font-semibold">
                      <Image
                        src={`https://flagcdn.com/w40/${selectedCountry.iso}.png`}
                        alt={
                          countryNames.of(
                            selectedCountry.country
                          ) ||
                          selectedCountry.country
                        }
                        width={22}
                        height={16}
                        className="h-4 w-6 rounded-sm object-cover"
                        unoptimized
                      />

                      {selectedCountry.code}
                    </span>
                  ) : (
                    <span className="text-zinc-400">
                      {t.contactPage.countryCode}
                    </span>
                  )}

                  <ChevronDown size={16} />
                </button>

                {countryOpen && (
                  <div className="absolute left-0 top-14 z-50 max-h-72 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                    {countryCodes.map(
                      (country) => (
                        <button
                          key={`${country.iso}-${country.code}-${country.country}`}
                          type="button"
                          onClick={() =>
                            selectCountry(country)
                          }
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-orange-50"
                        >
                          <Image
                            src={`https://flagcdn.com/w40/${country.iso}.png`}
                            alt={
                              countryNames.of(
                                country.country
                              ) ||
                              country.country
                            }
                            width={22}
                            height={16}
                            className="h-4 w-6 rounded-sm object-cover"
                            unoptimized
                          />

                          <span className="w-14 font-black">
                            {country.code}
                          </span>

                          <span>
                            {countryNames.of(
                              country.country
                            ) ||
                              country.country}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  update(
                    "phone",
                    event.target.value
                  )
                }
                placeholder={
                  t.contactPage.mobilePhone
                }
                autoComplete="tel"
                disabled={status === "loading"}
                className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
              />
            </div>
          </div>

          <select
            value={form.requestType}
            onChange={(event) =>
              update(
                "requestType",
                event.target.value
              )
            }
            disabled={status === "loading"}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-700 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
          >
            <option value="">
              {t.contactPage.requestType}
            </option>

            {REQUEST_TYPES.map(
              (requestType) => (
                <option
                  key={requestType}
                  value={requestType}
                >
                  {
                    t.contactPage.requestTypes[
                      requestType
                    ]
                  }
                </option>
              )
            )}
          </select>

          <input
            value={form.subject}
            onChange={(event) =>
              update(
                "subject",
                event.target.value
              )
            }
            placeholder={t.contactPage.subject}
            maxLength={255}
            disabled={status === "loading"}
            className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
          />
        </div>

        <div className="mt-1 text-right text-xs text-zinc-400">
          {form.subject.length}/255
        </div>

        <textarea
          value={form.message}
          onChange={(event) =>
            update(
              "message",
              event.target.value
            )
          }
          placeholder={t.contactPage.comment}
          rows={7}
          disabled={status === "loading"}
          className="mt-4 w-full resize-y rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
        />

        <button
          type="button"
          onClick={submit}
          disabled={status === "loading"}
          className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-3 font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" && (
            <Loader2
              size={18}
              className="animate-spin"
            />
          )}

          {status === "loading"
            ? t.contactPage.sending
            : t.contactPage.send}
        </button>

        {feedback && (
          <div
            role="status"
            className={`mt-5 rounded-2xl px-4 py-3 font-semibold ${
              status === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {feedback}
          </div>
        )}
      </div>
    </section>
  );
}