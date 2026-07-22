"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Globe2,
  Languages,
  Loader2,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
  UserRound,
} from "lucide-react";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

import {
  useAuthStore,
} from "@/store/auth.store";

type ConsentChannel =
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "PHONE";

type ChannelStatus =
  | "OPTIN"
  | "UNKNOWN"
  | "OPTOUT";

type SupportedLanguage =
  | "en"
  | "fr"
  | "es"
  | "pt"
  | "it"
  | "de";

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  mobilePhone: string | null;
  country: string | null;
  language: string;
  authProvider: string;
  isActive: boolean;
  emailVerified: boolean;
};

type Preferences = Record<
  ConsentChannel,
  boolean
>;

type ProfileResponse = {
  code?: string;
  message?: string;
  profile?: Profile;
};

type ConsentResponse = {
  code?: string;
  message?: string;
  consents?: Array<{
    channel: ConsentChannel;
    channelStatus:
      ChannelStatus;
  }>;
};

type RequestStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

const defaultPreferences: Preferences = {
  EMAIL: false,
  SMS: false,
  WHATSAPP: false,
  PHONE: false,
};

const LANGUAGE_OPTIONS: Array<{
  value: SupportedLanguage;
  label: string;
}> = [
  {
    value: "en",
    label: "English",
  },
  {
    value: "fr",
    label: "Français",
  },
  {
    value: "es",
    label: "Español",
  },
  {
    value: "pt",
    label: "Português",
  },
  {
    value: "it",
    label: "Italiano",
  },
  {
    value: "de",
    label: "Deutsch",
  },
];

const COUNTRY_OPTIONS = [
  "MA",
  "FR",
  "ES",
  "GB",
  "PT",
  "IT",
  "DE",
  "US",
  "CA",
  "BE",
  "CH",
  "NL",
  "DZ",
  "TN",
  "EG",
  "AE",
  "SA",
  "QA",
  "TR",
  "BR",
  "CN",
  "IN",
];

function buildLocalizedPath(
  locale: string,
  path: string
) {
  return locale === "en"
    ? path
    : `/${locale}${path}`;
}

function isUnauthorized(
  status: number
) {
  return status === 401;
}

export default function AccountPage() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const locale =
    getLocaleFromPath(
      pathname
    );

  const t =
    getDictionary(locale);

  const section =
    searchParams.get(
      "section"
    ) === "preferences"
      ? "preferences"
      : "profile";

  const {
    accessToken,
    isAuthenticated,
    updateUser,
    logout,
  } = useAuthStore();

  const [profile, setProfile] =
    useState<Profile | null>(
      null
    );

  const [
    preferences,
    setPreferences,
  ] = useState<Preferences>(
    defaultPreferences
  );

  const [
    initialPreferences,
    setInitialPreferences,
  ] = useState<Preferences>(
    defaultPreferences
  );

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true);

  const [
    profileStatus,
    setProfileStatus,
  ] =
    useState<RequestStatus>(
      "idle"
    );

  const [
    preferencesStatus,
    setPreferencesStatus,
  ] =
    useState<RequestStatus>(
      "idle"
    );

  const [
    profileFeedback,
    setProfileFeedback,
  ] = useState("");

  const [
    preferencesFeedback,
    setPreferencesFeedback,
  ] = useState("");

  const loginPath =
    buildLocalizedPath(
      locale,
      "/"
    );

  const contactPath =
    buildLocalizedPath(
      locale,
      "/contact"
    );

  const countryNames =
    useMemo(
      () =>
        new Intl.DisplayNames(
          [locale],
          {
            type: "region",
          }
        ),
      [locale]
    );

  useEffect(() => {
    if (
      !isAuthenticated ||
      !accessToken
    ) {
      router.replace(
        loginPath
      );

      setPageLoading(false);
      return;
    }

    const controller =
      new AbortController();

    async function loadAccount() {
      setPageLoading(true);
      setProfileFeedback("");
      setPreferencesFeedback("");

      try {
        const headers = {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        };

        const [
          profileResponse,
          consentsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/account/me`,
            {
              method: "GET",
              headers,
              signal:
                controller.signal,
            }
          ),

          fetch(
            `${API_URL}/api/account/consents`,
            {
              method: "GET",
              headers,
              signal:
                controller.signal,
            }
          ),
        ]);

        if (
          isUnauthorized(
            profileResponse.status
          ) ||
          isUnauthorized(
            consentsResponse.status
          )
        ) {
          logout();

          router.replace(
            loginPath
          );

          return;
        }

        const profileData =
          (await profileResponse.json()) as
            ProfileResponse;

        const consentData =
          (await consentsResponse.json()) as
            ConsentResponse;

        if (
          !profileResponse.ok ||
          !profileData.profile
        ) {
          throw new Error(
            profileData.message ||
              profileData.code ||
              t.accountPage
                .loadError
          );
        }

        if (
          !consentsResponse.ok ||
          !Array.isArray(
            consentData.consents
          )
        ) {
          throw new Error(
            consentData.message ||
              consentData.code ||
              t.accountPage
                .loadError
          );
        }

        const mappedPreferences: Preferences =
          {
            ...defaultPreferences,
          };

        for (
          const consent of
          consentData.consents
        ) {
          mappedPreferences[
            consent.channel
          ] =
            consent.channelStatus ===
            "OPTIN";
        }

        setProfile(
          profileData.profile
        );

        setPreferences(
          mappedPreferences
        );

        setInitialPreferences(
          mappedPreferences
        );
      } catch (error) {
        if (
          error instanceof
            DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "Unable to load account:",
          error
        );

        setProfileFeedback(
          t.accountPage.loadError
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setPageLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    isAuthenticated,
    loginPath,
    logout,
    router,
    t.accountPage.loadError,
  ]);

  const preferencesChanged =
    useMemo(
      () =>
        (
          Object.keys(
            preferences
          ) as ConsentChannel[]
        ).some(
          (channel) =>
            preferences[
              channel
            ] !==
            initialPreferences[
              channel
            ]
        ),
      [
        initialPreferences,
        preferences,
      ]
    );

  function updateProfile(
    field:
      | "firstName"
      | "lastName"
      | "country"
      | "language",
    value: string
  ) {
    setProfile((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });

    setProfileStatus("idle");
    setProfileFeedback("");
  }

  function updatePreference(
    channel: ConsentChannel,
    value: boolean
  ) {
    setPreferences(
      (current) => ({
        ...current,
        [channel]: value,
      })
    );

    setPreferencesStatus(
      "idle"
    );

    setPreferencesFeedback("");
  }

  async function saveProfile() {
    if (
      !profile ||
      !accessToken
    ) {
      return;
    }

    if (
      !profile.firstName.trim()
    ) {
      setProfileStatus(
        "error"
      );

      setProfileFeedback(
        t.accountPage.validation
          .firstName
      );

      return;
    }

    if (
      !profile.lastName.trim()
    ) {
      setProfileStatus(
        "error"
      );

      setProfileFeedback(
        t.accountPage.validation
          .lastName
      );

      return;
    }

    if (
      !profile.language.trim()
    ) {
      setProfileStatus(
        "error"
      );

      setProfileFeedback(
        t.accountPage.validation
          .language
      );

      return;
    }

    setProfileStatus(
      "loading"
    );

    setProfileFeedback("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/account/me`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body: JSON.stringify({
              firstName:
                profile.firstName.trim(),

              lastName:
                profile.lastName.trim(),

              country:
                profile.country ||
                null,

              language:
                profile.language,
            }),
          }
        );

      if (
        isUnauthorized(
          response.status
        )
      ) {
        logout();

        router.replace(
          loginPath
        );

        return;
      }

      const data =
        (await response.json()) as
          ProfileResponse;

      if (
        !response.ok ||
        !data.profile
      ) {
        throw new Error(
          data.message ||
            data.code ||
            t.accountPage
              .profileSaveError
        );
      }

      setProfile(
        data.profile
      );

      updateUser({
        firstName:
          data.profile.firstName,

        lastName:
          data.profile.lastName,

        email:
          data.profile.email || "",

        isActive:
          data.profile.isActive,

        emailVerified:
          data.profile
            .emailVerified,
      });

      setProfileStatus(
        "success"
      );

      setProfileFeedback(
        t.accountPage
          .profileSaved
      );
    } catch (error) {
      console.error(
        "Unable to save profile:",
        error
      );

      setProfileStatus(
        "error"
      );

      setProfileFeedback(
        t.accountPage
          .profileSaveError
      );
    }
  }

  async function savePreferences() {
    if (!accessToken) {
      return;
    }

    setPreferencesStatus(
      "loading"
    );

    setPreferencesFeedback("");

    try {
      const consents =
        (
          Object.keys(
            preferences
          ) as ConsentChannel[]
        ).map((channel) => ({
          channel,

          channelStatus:
            preferences[
              channel
            ]
              ? "OPTIN"
              : "OPTOUT",
        }));

      const response =
        await fetch(
          `${API_URL}/api/account/consents`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body: JSON.stringify({
              consents,
            }),
          }
        );

      if (
        isUnauthorized(
          response.status
        )
      ) {
        logout();

        router.replace(
          loginPath
        );

        return;
      }

      const data =
        (await response.json()) as
          ConsentResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.code ||
            t.accountPage
              .preferencesSaveError
        );
      }

      setInitialPreferences({
        ...preferences,
      });

      setPreferencesStatus(
        "success"
      );

      setPreferencesFeedback(
        t.accountPage
          .preferencesSaved
      );
    } catch (error) {
      console.error(
        "Unable to save preferences:",
        error
      );

      setPreferencesStatus(
        "error"
      );

      setPreferencesFeedback(
        t.accountPage
          .preferencesSaveError
      );
    }
  }

  if (pageLoading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="h-4 w-28 animate-pulse rounded-full bg-zinc-200" />

        <div className="mt-4 h-12 w-72 animate-pulse rounded-full bg-zinc-200" />

        <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-full bg-zinc-200" />

        <div className="mt-8 rounded-[2rem] bg-white p-6 card-shadow md:p-8">
          <div className="h-14 w-72 animate-pulse rounded-2xl bg-zinc-200" />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl bg-zinc-200"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (
    !isAuthenticated ||
    !accessToken
  ) {
    return null;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
        {
          t.accountPage
            .eyebrow
        }
      </p>

      <h1 className="mt-3 text-5xl font-black text-zinc-950">
        {section ===
        "preferences"
          ? t.accountPage
              .preferencesTitle
          : t.accountPage
              .profileTitle}
      </h1>

      <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700">
        {
          t.accountPage
            .description
        }
      </p>

      <div className="mt-8 rounded-[2rem] bg-white p-6 card-shadow md:p-8">
        {section ===
        "preferences" ? (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                <MessageCircle
                  size={22}
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-zinc-950">
                  {
                    t.accountPage
                      .communicationPreferences
                  }
                </h2>

                <p className="text-sm text-zinc-500">
                  {
                    t.accountPage
                      .communicationPreferencesDescription
                  }
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <PreferenceRow
                icon={
                  <Mail
                    size={20}
                    className="text-orange-700"
                  />
                }
                title={
                  t.accountPage
                    .channels.emailTitle
                }
                description={
                  t.accountPage
                    .channels.emailDescription
                }
                checked={
                  preferences.EMAIL
                }
                disabled={
                  preferencesStatus ===
                  "loading"
                }
                onChange={(value) =>
                  updatePreference(
                    "EMAIL",
                    value
                  )
                }
              />

              <PreferenceRow
                icon={
                  <Phone
                    size={20}
                    className="text-orange-700"
                  />
                }
                title={
                  t.accountPage
                    .channels.smsTitle
                }
                description={
                  t.accountPage
                    .channels.smsDescription
                }
                checked={
                  preferences.SMS
                }
                disabled={
                  preferencesStatus ===
                  "loading"
                }
                onChange={(value) =>
                  updatePreference(
                    "SMS",
                    value
                  )
                }
              />

              <PreferenceRow
                icon={
                  <MessageCircle
                    size={20}
                    className="text-orange-700"
                  />
                }
                title={
                  t.accountPage
                    .channels.whatsappTitle
                }
                description={
                  t.accountPage
                    .channels.whatsappDescription
                }
                checked={
                  preferences.WHATSAPP
                }
                disabled={
                  preferencesStatus ===
                  "loading"
                }
                onChange={(value) =>
                  updatePreference(
                    "WHATSAPP",
                    value
                  )
                }
              />

              <PreferenceRow
                icon={
                  <PhoneCall
                    size={20}
                    className="text-orange-700"
                  />
                }
                title={
                  t.accountPage
                    .channels.phoneTitle
                }
                description={
                  t.accountPage
                    .channels.phoneDescription
                }
                checked={
                  preferences.PHONE
                }
                disabled={
                  preferencesStatus ===
                  "loading"
                }
                onChange={(value) =>
                  updatePreference(
                    "PHONE",
                    value
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={
                savePreferences
              }
              disabled={
                preferencesStatus ===
                  "loading" ||
                !preferencesChanged
              }
              className="mt-8 flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-3 font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {preferencesStatus ===
                "loading" && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {preferencesStatus ===
              "loading"
                ? t.accountPage
                    .saving
                : t.accountPage
                    .savePreferences}
            </button>

            {preferencesFeedback && (
              <FeedbackMessage
                status={
                  preferencesStatus
                }
                message={
                  preferencesFeedback
                }
              />
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                <UserRound
                  size={22}
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-zinc-950">
                  {
                    t.accountPage
                      .profileInformation
                  }
                </h2>

                <p className="text-sm text-zinc-500">
                  {
                    t.accountPage
                      .profileInformationDescription
                  }
                </p>
              </div>
            </div>

            {profile ? (
              <>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-zinc-600">
                      {
                        t.accountPage
                          .firstName
                      }
                    </label>

                    <input
                      value={
                        profile.firstName
                      }
                      onChange={(
                        event
                      ) =>
                        updateProfile(
                          "firstName",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        profileStatus ===
                        "loading"
                      }
                      className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-zinc-600">
                      {
                        t.accountPage
                          .lastName
                      }
                    </label>

                    <input
                      value={
                        profile.lastName
                      }
                      onChange={(
                        event
                      ) =>
                        updateProfile(
                          "lastName",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        profileStatus ===
                        "loading"
                      }
                      className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-zinc-600">
                      {
                        t.accountPage
                          .country
                      }
                    </label>

                    <div className="relative">
                      <Globe2
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-700"
                      />

                      <select
                        value={
                          profile.country ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateProfile(
                            "country",
                            event.target
                              .value
                          )
                        }
                        disabled={
                          profileStatus ===
                          "loading"
                        }
                        className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
                      >
                        <option value="">
                          {
                            t.accountPage
                              .selectCountry
                          }
                        </option>

                        {COUNTRY_OPTIONS.map(
                          (country) => (
                            <option
                              key={
                                country
                              }
                              value={
                                country
                              }
                            >
                              {countryNames.of(
                                country
                              ) ||
                                country}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-zinc-600">
                      {
                        t.accountPage
                          .language
                      }
                    </label>

                    <div className="relative">
                      <Languages
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-700"
                      />

                      <select
                        value={
                          profile.language
                        }
                        onChange={(
                          event
                        ) =>
                          updateProfile(
                            "language",
                            event.target
                              .value
                          )
                        }
                        disabled={
                          profileStatus ===
                          "loading"
                        }
                        className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
                      >
                        {LANGUAGE_OPTIONS.map(
                          (language) => (
                            <option
                              key={
                                language.value
                              }
                              value={
                                language.value
                              }
                            >
                              {
                                language.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <ReadOnlyField
                    label={
                      t.accountPage
                        .email
                    }
                    value={
                      profile.email ||
                      t.accountPage
                        .notProvided
                    }
                    icon={
                      <Mail
                        size={18}
                      />
                    }
                  />

                  <ReadOnlyField
                    label={
                      t.accountPage
                        .mobilePhone
                    }
                    value={
                      profile.mobilePhone ||
                      t.accountPage
                        .notProvided
                    }
                    icon={
                      <Phone
                        size={18}
                      />
                    }
                  />
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm font-semibold leading-6 text-orange-900">
                  <LockKeyhole
                    size={20}
                    className="mt-0.5 shrink-0"
                  />

                  <p>
                    {
                      t.accountPage
                        .protectedFieldsNote
                    }{" "}

                    <Link
                      href={
                        contactPath
                      }
                      className="font-black underline underline-offset-2"
                    >
                      {
                        t.accountPage
                          .contactSupport
                      }
                    </Link>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    saveProfile
                  }
                  disabled={
                    profileStatus ===
                    "loading"
                  }
                  className="mt-8 flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-3 font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {profileStatus ===
                    "loading" && (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  {profileStatus ===
                  "loading"
                    ? t.accountPage
                        .saving
                    : t.accountPage
                        .saveProfile}
                </button>

                {profileFeedback && (
                  <FeedbackMessage
                    status={
                      profileStatus
                    }
                    message={
                      profileFeedback
                    }
                  />
                )}
              </>
            ) : (
              <FeedbackMessage
                status="error"
                message={
                  profileFeedback ||
                  t.accountPage
                    .loadError
                }
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-600">
        {label}
      </label>

      <div className="flex min-h-[50px] items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-700">
        <span className="shrink-0 text-zinc-500">
          {icon}
        </span>

        <span className="min-w-0 break-words font-semibold">
          {value}
        </span>

        <LockKeyhole
          size={16}
          className="ml-auto shrink-0 text-zinc-400"
        />
      </div>
    </div>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-5 py-4 transition hover:border-orange-200 hover:bg-orange-50/30">
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="font-black text-zinc-950">
            {title}
          </p>

          <p className="mt-1 text-sm leading-6 text-zinc-500">
            {description}
          </p>
        </div>
      </div>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="h-5 w-5 shrink-0 accent-orange-600"
      />
    </label>
  );
}

function FeedbackMessage({
  status,
  message,
}: {
  status: RequestStatus;
  message: string;
}) {
  return (
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
  );
}