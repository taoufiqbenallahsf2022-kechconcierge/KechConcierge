"use client";

import {
  Languages,
  Loader2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

type SupportedLanguage =
  | "en"
  | "fr"
  | "es"
  | "pt"
  | "it"
  | "de";

type AccountProfileResponse = {
  profile?: {
    id: string;
    language: string;
  };

  code?: string;
  message?: string;
};

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "en",
  "fr",
  "es",
  "pt",
  "it",
  "de",
];

const LANGUAGE_LABELS: Record<
  SupportedLanguage,
  string
> = {
  en: "English",
  fr: "Français",
  es: "Español",
  pt: "Português",
  it: "Italiano",
  de: "Deutsch",
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

function isSupportedLanguage(
  value: string
): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(
    value as SupportedLanguage
  );
}

function removeLocaleFromPath(
  pathname: string
) {
  const segments = pathname
    .split("/")
    .filter(Boolean);

  if (
    segments.length > 0 &&
    isSupportedLanguage(
      segments[0]
    )
  ) {
    const pathWithoutLocale =
      `/${segments
        .slice(1)
        .join("/")}`;

    return pathWithoutLocale === "/"
      ? "/"
      : pathWithoutLocale;
  }

  return pathname || "/";
}

function buildLocalizedPath(
  pathname: string,
  language: SupportedLanguage
) {
  const pathWithoutLocale =
    removeLocaleFromPath(pathname);

  if (language === "en") {
    return pathWithoutLocale || "/";
  }

  if (
    pathWithoutLocale === "/" ||
    pathWithoutLocale === ""
  ) {
    return `/${language}`;
  }

  return `/${language}${pathWithoutLocale}`;
}

function getDismissKey(
  individualId: string,
  currentLanguage: string,
  preferredLanguage: string
) {
  return [
    "moorish-language-prompt",
    individualId,
    currentLanguage,
    preferredLanguage,
  ].join(":");
}

export default function PreferredLanguagePrompt() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const currentLocale =
    getLocaleFromPath(
      pathname
    );

  const t =
    getDictionary(
      currentLocale
    );

  const [
    preferredLanguage,
    setPreferredLanguage,
  ] =
    useState<SupportedLanguage | null>(
      null
    );

  const [
    individualId,
    setIndividualId,
  ] =
    useState<string | null>(
      null
    );

  const [
    promptVisible,
    setPromptVisible,
  ] = useState(false);

  const [
    switching,
    setSwitching,
  ] = useState(false);

  const preferredLanguageLabel =
    useMemo(() => {
      if (!preferredLanguage) {
        return "";
      }

      return LANGUAGE_LABELS[
        preferredLanguage
      ];
    }, [preferredLanguage]);

  useEffect(() => {
    const controller =
      new AbortController();

    async function checkPreferredLanguage() {
      const accessToken =
        localStorage.getItem(
          "kech_access_token"
        );

      const storedUser =
        localStorage.getItem(
          "kech_user"
        );

      if (
        !accessToken ||
        !storedUser
      ) {
        setPromptVisible(false);
        setPreferredLanguage(null);
        setIndividualId(null);

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/account/me`,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",

                Authorization:
                  `Bearer ${accessToken}`,
              },

              signal:
                controller.signal,
            }
          );

        if (!response.ok) {
          setPromptVisible(false);
          return;
        }

        const data =
          (await response.json()) as
            AccountProfileResponse;

        const profile =
          data.profile;

        if (
          !profile ||
          !profile.id ||
          !profile.language
        ) {
          setPromptVisible(false);
          return;
        }

        const normalizedLanguage =
          profile.language
            .trim()
            .toLowerCase();

        if (
          !isSupportedLanguage(
            normalizedLanguage
          )
        ) {
          setPromptVisible(false);
          return;
        }

        setIndividualId(
          profile.id
        );

        setPreferredLanguage(
          normalizedLanguage
        );

        if (
          normalizedLanguage ===
          currentLocale
        ) {
          setPromptVisible(false);
          return;
        }

        const dismissKey =
          getDismissKey(
            profile.id,
            currentLocale,
            normalizedLanguage
          );

        const dismissed =
          sessionStorage.getItem(
            dismissKey
          ) === "true";

        setPromptVisible(
          !dismissed
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
          "Unable to check preferred language:",
          error
        );

        setPromptVisible(false);
      }
    }

    checkPreferredLanguage();

    function handleAuthChange() {
      checkPreferredLanguage();
    }

    window.addEventListener(
      "kech-auth-change",
      handleAuthChange
    );

    return () => {
      controller.abort();

      window.removeEventListener(
        "kech-auth-change",
        handleAuthChange
      );
    };
  }, [
    currentLocale,
    pathname,
  ]);

  function stayOnCurrentLanguage() {
    if (
      individualId &&
      preferredLanguage
    ) {
      const dismissKey =
        getDismissKey(
          individualId,
          currentLocale,
          preferredLanguage
        );

      sessionStorage.setItem(
        dismissKey,
        "true"
      );
    }

    setPromptVisible(false);
  }

  function switchLanguage() {
    if (!preferredLanguage) {
      return;
    }

    setSwitching(true);

    const targetPath =
      buildLocalizedPath(
        pathname,
        preferredLanguage
      );

    router.push(targetPath);
  }

  if (
    !promptVisible ||
    !preferredLanguage
  ) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-5 z-[100] mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-orange-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-orange-100 blur-2xl" />

        <button
          type="button"
          onClick={
            stayOnCurrentLanguage
          }
          disabled={switching}
          aria-label={
            t.languagePrompt.close
          }
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
        >
          <X size={18} />
        </button>

        <div className="relative flex items-start gap-4 pr-8">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-700">
            <Languages size={23} />
          </div>

          <div>
            <p className="text-lg font-black text-zinc-950">
              {
                t.languagePrompt.title
              }
            </p>

            <p className="mt-2 leading-7 text-zinc-600">
              {
                t.languagePrompt.description
              }{" "}

              <span className="font-black text-zinc-900">
                {
                  preferredLanguageLabel
                }
              </span>
              .
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={
              stayOnCurrentLanguage
            }
            disabled={switching}
            className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-black text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {
              t.languagePrompt
                .stayButton
            }
          </button>

          <button
            type="button"
            onClick={
              switchLanguage
            }
            disabled={switching}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-70"
          >
            {switching && (
              <Loader2
                size={17}
                className="animate-spin"
              />
            )}

            {
              t.languagePrompt
                .switchButton
            }
          </button>
        </div>
      </div>
    </div>
  );
}