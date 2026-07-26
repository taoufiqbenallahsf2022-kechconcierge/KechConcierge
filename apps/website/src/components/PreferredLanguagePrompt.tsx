"use client";

import { Languages, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";

type SupportedLanguage = "en" | "fr" | "es" | "pt" | "it" | "de";
type AccountProfileResponse = {
  profile?: { id: string; language: string };
};

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "en",
  "fr",
  "es",
  "pt",
  "it",
  "de",
];

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
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

const PROMPT_DISMISSAL_DURATION =
  24 * 60 * 60 * 1000;

function getDismissalKey(
  individualId: string,
  currentLanguage: SupportedLanguage,
  preferredLanguage: SupportedLanguage,
) {
  return [
    "moorish-language-prompt-dismissed",
    individualId,
    currentLanguage,
    preferredLanguage,
  ].join(":");
}

function wasDismissedRecently(key: string) {
  const dismissedAt = Number(
    localStorage.getItem(key),
  );

  if (
    !Number.isFinite(dismissedAt) ||
    dismissedAt <= 0
  ) {
    localStorage.removeItem(key);
    return false;
  }

  if (
    Date.now() - dismissedAt >=
    PROMPT_DISMISSAL_DURATION
  ) {
    localStorage.removeItem(key);
    return false;
  }

  return true;
}

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

function removeLocaleFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length && isSupportedLanguage(segments[0])) {
    const path = `/${segments.slice(1).join("/")}`;
    return path === "/" ? "/" : path;
  }
  return pathname || "/";
}

function buildLocalizedPath(
  pathname: string,
  language: SupportedLanguage,
) {
  const path = removeLocaleFromPath(pathname);
  if (language === "en") return path || "/";
  return path === "/" || path === "" ? `/${language}` : `/${language}${path}`;
}

export default function PreferredLanguagePrompt() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = getLocaleFromPath(pathname);
  const t = getDictionary(currentLocale);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [preferredLanguage, setPreferredLanguage] =
    useState<SupportedLanguage | null>(null);
  const [individualId, setIndividualId] =
    useState<string | null>(null);
  const [promptVisible, setPromptVisible] = useState(false);
  const [switching, setSwitching] = useState(false);

  const preferredLanguageLabel = useMemo(
    () =>
      preferredLanguage
        ? LANGUAGE_LABELS[preferredLanguage]
        : "",
    [preferredLanguage],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function checkPreferredLanguage() {
      const accessToken = localStorage.getItem("kech_access_token");
      const storedUser = localStorage.getItem("kech_user");

      if (!accessToken || !storedUser) {
        setPromptVisible(false);
        setPreferredLanguage(null);
        setIndividualId(null);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/account/me`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });
        if (!response.ok) {
          setPromptVisible(false);
          return;
        }

        const data = (await response.json()) as AccountProfileResponse;
        const normalizedLanguage = data.profile?.language
          ?.trim()
          .toLowerCase();

        if (
          !normalizedLanguage ||
          !isSupportedLanguage(normalizedLanguage) ||
          !data.profile?.id
        ) {
          setPromptVisible(false);
          setPreferredLanguage(null);
          setIndividualId(null);
          return;
        }

        setIndividualId(data.profile.id);
        setPreferredLanguage(normalizedLanguage);
        setSwitching(false);

        if (normalizedLanguage === currentLocale) {
          setPromptVisible(false);
          return;
        }

        const dismissalKey = getDismissalKey(
          data.profile.id,
          currentLocale,
          normalizedLanguage,
        );

        setPromptVisible(
          !wasDismissedRecently(dismissalKey),
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
        console.error("Unable to check preferred language:", error);
        setPromptVisible(false);
      }
    }

    void checkPreferredLanguage();

    function handleAuthChange() {
      /*
       * Re-evaluate after login/logout. Dismissals are scoped by
       * Individual ID, so another account is never suppressed.
       */
      setPromptVisible(false);
      void checkPreferredLanguage();
    }

    window.addEventListener("kech-auth-change", handleAuthChange);
    return () => {
      controller.abort();
      window.removeEventListener("kech-auth-change", handleAuthChange);
    };
  }, [currentLocale, pathname]);

  useEffect(() => {
    if (!promptVisible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !switching) {
        dismissPrompt();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [promptVisible, switching]);

  function dismissPrompt() {
    if (individualId && preferredLanguage) {
      localStorage.setItem(
        getDismissalKey(
          individualId,
          currentLocale,
          preferredLanguage,
        ),
        String(Date.now()),
      );
    }

    setPromptVisible(false);
  }

  function switchLanguage() {
    if (!preferredLanguage) return;
    setSwitching(true);
    router.replace(buildLocalizedPath(pathname, preferredLanguage));
  }

  if (!promptVisible || !preferredLanguage) return null;

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !switching) {
          dismissPrompt();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferred-language-title"
        tabIndex={-1}
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-white p-7 shadow-[0_30px_100px_rgba(0,0,0,0.45)] outline-none sm:p-9"
      >
        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-orange-100 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-amber-50 blur-2xl" />

        <button
          type="button"
          onClick={dismissPrompt}
          disabled={switching}
          aria-label={t.languagePrompt.close}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
        >
          <X size={18} />
        </button>

        <div className="relative flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-orange-700 ring-8 ring-orange-50/50">
            <Languages size={29} />
          </div>

          <div className="mt-6">
            <h2
              id="preferred-language-title"
              className="text-2xl font-black tracking-tight text-zinc-950"
            >
              {t.languagePrompt.title}
            </h2>
            <p className="mx-auto mt-3 max-w-sm leading-7 text-zinc-600">
              {t.languagePrompt.description}{" "}
              <span className="font-black text-zinc-900">
                {preferredLanguageLabel}
              </span>
              .
            </p>
          </div>
        </div>

        <div className="relative mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={dismissPrompt}
            disabled={switching}
            className="min-w-40 rounded-full border border-zinc-200 px-5 py-3 text-sm font-black text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800 disabled:opacity-60"
          >
            {t.languagePrompt.stayButton}
          </button>

          <button
            type="button"
            onClick={switchLanguage}
            disabled={switching}
            className="inline-flex min-w-40 items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-70"
          >
            {switching && <Loader2 size={17} className="animate-spin" />}
            {t.languagePrompt.switchButton}
          </button>
        </div>
      </div>
    </div>
  );
}
