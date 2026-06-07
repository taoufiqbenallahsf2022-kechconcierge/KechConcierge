"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

type ContactForm = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  countryIso: string;
  phone: string;
  requestType: string;
  subject: string;
  message: string;
};

const requestTypes = [
  "Looking for advisor/guide",
  "Complaint",
  "Support",
  "Partnership",
  "Other",
];

const countryCodes = [
  { iso: "fr", name: "France", code: "+33" },
  { iso: "es", name: "Spain", code: "+34" },
  { iso: "gb", name: "United Kingdom", code: "+44" },
  { iso: "pt", name: "Portugal", code: "+351" },
  { iso: "it", name: "Italy", code: "+39" },
  { iso: "de", name: "Germany", code: "+49" },
  { iso: "ma", name: "Morocco", code: "+212" },
  { iso: "us", name: "United States", code: "+1" },
  { iso: "ca", name: "Canada", code: "+1" },
  { iso: "be", name: "Belgium", code: "+32" },
  { iso: "ch", name: "Switzerland", code: "+41" },
  { iso: "nl", name: "Netherlands", code: "+31" },
  { iso: "dz", name: "Algeria", code: "+213" },
  { iso: "tn", name: "Tunisia", code: "+216" },
  { iso: "eg", name: "Egypt", code: "+20" },
  { iso: "ae", name: "United Arab Emirates", code: "+971" },
  { iso: "sa", name: "Saudi Arabia", code: "+966" },
  { iso: "qa", name: "Qatar", code: "+974" },
  { iso: "tr", name: "Turkey", code: "+90" },
  { iso: "br", name: "Brazil", code: "+55" },
  { iso: "cn", name: "China", code: "+86" },
  { iso: "in", name: "India", code: "+91" },
];

export default function ContactPage() {
  const [countryOpen, setCountryOpen] = useState(false);

  const [form, setForm] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "",
    countryIso: "",
    phone: "",
    requestType: "",
    subject: "",
    message: "",
  });

  const selectedCountry = countryCodes.find(
    (country) =>
      country.iso === form.countryIso && country.code === form.countryCode
  );

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [feedback, setFeedback] = useState("");

  function update(field: keyof ContactForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectCountry(country: (typeof countryCodes)[number]) {
    setForm((current) => ({
      ...current,
      countryIso: country.iso,
      countryCode: country.code,
    }));

    setCountryOpen(false);
  }

  function submit() {
    setStatus("loading");
    setFeedback("");

    setTimeout(() => {
      if (!form.firstName.trim()) {
        setStatus("error");
        setFeedback("Please fill your first name.");
        return;
      }

      if (!form.lastName.trim()) {
        setStatus("error");
        setFeedback("Please fill your last name.");
        return;
      }

      if (!form.email.trim()) {
        setStatus("error");
        setFeedback("Please fill your email address.");
        return;
      }

      if (!form.email.includes("@")) {
        setStatus("error");
        setFeedback("Please enter a valid email address.");
        return;
      }

      if (form.phone.trim() && !form.countryCode.trim()) {
        setStatus("error");
        setFeedback("Please select the country code for your phone number.");
        return;
      }

      if (form.countryCode.trim() && !form.phone.trim()) {
        setStatus("error");
        setFeedback("Please enter your phone number or remove the country code.");
        return;
      }

      if (!form.requestType.trim()) {
        setStatus("error");
        setFeedback("Please select the type of your request.");
        return;
      }

      if (!form.subject.trim()) {
        setStatus("error");
        setFeedback("Please fill the subject of your request.");
        return;
      }

      if (!form.message.trim()) {
        setStatus("error");
        setFeedback("Please write your message.");
        return;
      }

      setStatus("success");
      setFeedback(
        "Your message was simulated successfully. Later this will be sent to the API."
      );

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        countryCode: "",
        countryIso: "",
        phone: "",
        requestType: "",
        subject: "",
        message: "",
      });
    }, 900);
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
          Contact
        </p>

        <h1 className="mt-3 text-5xl font-black text-zinc-950">
          Tell us what you need.
        </h1>

        <p className="mt-5 text-lg leading-8 text-zinc-700">
          Ask for a villa, apartment, activity, transfer, SPA, restaurant, or
          complete Marrakech plan.
        </p>

        <div className="mt-8 rounded-3xl bg-zinc-950 p-6 text-white">
          <p className="font-black">Other contact options</p>
          <p className="mt-3 text-zinc-300">WhatsApp: +212 600 000 000</p>
          <p className="text-zinc-300">Email: contact@kechconcierge.local</p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 card-shadow md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="First name *"
            className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
          />

          <input
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Last name *"
            className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
          />

          {/* EMAIL */}

          <div className="md:col-span-2">
            <input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Email *"
              className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
            />
          </div>

          {/* PHONE */}

          <div className="md:col-span-2">
            <div className="grid gap-3 md:grid-cols-[180px_1fr]">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCountryOpen((current) => !current)}
                  className="flex h-[50px] w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4"
                >
                  {selectedCountry ? (
                    <span className="flex items-center gap-2 font-semibold">
                      <Image
                        src={`https://flagcdn.com/w40/${selectedCountry.iso}.png`}
                        alt={selectedCountry.name}
                        width={22}
                        height={16}
                        className="h-4 w-6 rounded-sm object-cover"
                        unoptimized
                      />
                      {selectedCountry.code}
                    </span>
                  ) : (
                    <span className="text-zinc-400">Country code</span>
                  )}

                  <ChevronDown size={16} />
                </button>

                {countryOpen && (
                  <div className="absolute left-0 top-14 z-50 max-h-72 w-80 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                    {countryCodes.map((country) => (
                      <button
                        key={`${country.iso}-${country.code}`}
                        type="button"
                        onClick={() => selectCountry(country)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-orange-50"
                      >
                        <Image
                          src={`https://flagcdn.com/w40/${country.iso}.png`}
                          alt={country.name}
                          width={22}
                          height={16}
                          className="h-4 w-6 rounded-sm object-cover"
                          unoptimized
                        />
                        <span className="w-14 font-black">{country.code}</span>
                        <span>{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="Mobile phone"
                className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
              />
            </div>
          </div>

          <select
            value={form.requestType}
            onChange={(e) => update("requestType", e.target.value)}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-700 outline-none focus:border-orange-400"
          >
            <option value="">Type of request *</option>
            {requestTypes.map((requestType) => (
              <option key={requestType} value={requestType}>
                {requestType}
              </option>
            ))}
          </select>

          <input
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            placeholder="Subject *"
            maxLength={255}
            className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
          />
        </div>

        <div className="mt-1 text-right text-xs text-zinc-400">
          {form.subject.length}/255
        </div>

        <textarea
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Comment / request *"
          rows={7}
          className="mt-4 w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
        />

        <button
          onClick={submit}
          disabled={status === "loading"}
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
        >
          {status === "loading" && (
            <Loader2 size={18} className="animate-spin" />
          )}
          Send message
        </button>

        {feedback && (
          <div
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