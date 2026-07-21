"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  countryIso: string;
  phone: string;
};

type Preferences = {
  emailPromotions: boolean;
  smsPromotions: boolean;
  whatsappPromotions: boolean;
};

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

export default function AccountPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "profile";

  const [countryOpen, setCountryOpen] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    firstName: "Taoufiq",
    lastName: "Benallah",
    email: "taoufiq@example.com",
    countryCode: "+212",
    countryIso: "ma",
    phone: "600000000",
  });

  const [preferences, setPreferences] = useState<Preferences>({
    emailPromotions: true,
    smsPromotions: false,
    whatsappPromotions: true,
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [feedback, setFeedback] = useState("");

  const selectedCountry = countryCodes.find(
    (country) =>
      country.iso === profile.countryIso && country.code === profile.countryCode
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("kech_user");

    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);

      setProfile({
        firstName: parsedUser.firstName ?? "Taoufiq",
        lastName: parsedUser.lastName ?? "Benallah",
        email: parsedUser.email ?? "taoufiq@example.com",
        countryCode: parsedUser.countryCode ?? "+212",
        countryIso: parsedUser.countryIso ?? "ma",
        phone: parsedUser.phone ?? "600000000",
      });
    } catch {
      localStorage.removeItem("kech_user");
    }
  }, []);

  function updateProfile(field: keyof Profile, value: string) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectCountry(country: (typeof countryCodes)[number]) {
    setProfile((current) => ({
      ...current,
      countryIso: country.iso,
      countryCode: country.code,
    }));

    setCountryOpen(false);
  }

  function updatePreference(field: keyof Preferences, value: boolean) {
    setPreferences((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveProfile() {
    setStatus("loading");
    setFeedback("");

    setTimeout(() => {
      if (!profile.firstName.trim()) {
        setStatus("error");
        setFeedback("Please fill your first name.");
        return;
      }

      if (!profile.lastName.trim()) {
        setStatus("error");
        setFeedback("Please fill your last name.");
        return;
      }

      if (!profile.email.includes("@")) {
        setStatus("error");
        setFeedback("Please enter a valid email address.");
        return;
      }

      if (profile.phone.trim() && !profile.countryCode.trim()) {
        setStatus("error");
        setFeedback("Please select the country code for your phone number.");
        return;
      }

      if (profile.countryCode.trim() && !profile.phone.trim()) {
        setStatus("error");
        setFeedback("Please enter your phone number or remove the country code.");
        return;
      }

      localStorage.setItem("kech_user", JSON.stringify(profile));
      window.dispatchEvent(new Event("kech-auth-change"));

      setStatus("success");
      setFeedback(
        "Profile saved. Simulation: if email or phone changed, a verification email/SMS would be sent before applying the update."
      );
    }, 900);
  }

  function savePreferences() {
    setStatus("loading");
    setFeedback("");

    setTimeout(() => {
      setStatus("success");
      setFeedback("Preferences saved successfully.");
    }, 900);
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
        Account
      </p>

      <h1 className="mt-3 text-5xl font-black text-zinc-950">
        {section === "preferences" ? "Preferences center" : "My profile"}
      </h1>

      <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700">
        Manage your personal information and communication preferences. This is
        a frontend simulation for now.
      </p>

      <div className="mt-8 rounded-[2rem] bg-white p-6 card-shadow md:p-8">
        {section === "preferences" ? (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                <MessageCircle size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-zinc-950">
                  Communication preferences
                </h2>
                <p className="text-sm text-zinc-500">
                  Choose how Moorish Concierge can contact you.
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-orange-700" />
                  <div>
                    <p className="font-black text-zinc-950">
                      Email promotions
                    </p>
                    <p className="text-sm text-zinc-500">
                      Receive offers, updates, and travel suggestions by email.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={preferences.emailPromotions}
                  onChange={(e) =>
                    updatePreference("emailPromotions", e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-orange-700" />
                  <div>
                    <p className="font-black text-zinc-950">SMS promotions</p>
                    <p className="text-sm text-zinc-500">
                      Receive important offers and updates by SMS.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={preferences.smsPromotions}
                  onChange={(e) =>
                    updatePreference("smsPromotions", e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <MessageCircle size={20} className="text-orange-700" />
                  <div>
                    <p className="font-black text-zinc-950">
                      WhatsApp promotions
                    </p>
                    <p className="text-sm text-zinc-500">
                      Receive offers and concierge updates by WhatsApp.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={preferences.whatsappPromotions}
                  onChange={(e) =>
                    updatePreference("whatsappPromotions", e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </label>
            </div>

            <button
              onClick={savePreferences}
              disabled={status === "loading"}
              className="mt-8 flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
            >
              {status === "loading" && (
                <Loader2 size={18} className="animate-spin" />
              )}
              Save preferences
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                <UserRound size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-zinc-950">
                  Profile information
                </h2>
                <p className="text-sm text-zinc-500">
                  Update your personal details.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <input
                value={profile.firstName}
                onChange={(e) => updateProfile("firstName", e.target.value)}
                placeholder="First name"
                className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
              />

              <input
                value={profile.lastName}
                onChange={(e) => updateProfile("lastName", e.target.value)}
                placeholder="Last name"
                className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
              />

              <div className="md:col-span-2">
                <input
                  value={profile.email}
                  onChange={(e) => updateProfile("email", e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </div>

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
                            <span className="w-14 font-black">
                              {country.code}
                            </span>
                            <span>{country.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="tel"
                    inputMode="tel"
                    value={profile.phone}
                    onChange={(e) => updateProfile("phone", e.target.value)}
                    placeholder="Mobile phone"
                    className="rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold leading-6 text-orange-800">
              If email or phone is changed, the backend will later send a
              verification code by email or SMS before applying the update.
            </div>

            <button
              onClick={saveProfile}
              disabled={status === "loading"}
              className="mt-8 flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 font-black text-white transition hover:bg-orange-700 disabled:opacity-70"
            >
              {status === "loading" && (
                <Loader2 size={18} className="animate-spin" />
              )}
              Save profile
            </button>
          </>
        )}

        {feedback && (
          <div
            className={`mt-6 rounded-2xl px-4 py-3 font-semibold ${
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