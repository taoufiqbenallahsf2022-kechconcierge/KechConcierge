"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import AuthModal from "./AuthModal";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";

type SimulatedUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

const languages = [
  {
    code: "en",
    label: "English",
    short: "EN",
    flag: "https://flagcdn.com/w40/gb.png",
  },
  {
    code: "fr",
    label: "Français",
    short: "FR",
    flag: "https://flagcdn.com/w40/fr.png",
  },
  {
    code: "de",
    label: "Deutsch",
    short: "DE",
    flag: "https://flagcdn.com/w40/de.png",
  },
  {
    code: "it",
    label: "Italiano",
    short: "IT",
    flag: "https://flagcdn.com/w40/it.png",
  },
  {
    code: "pt",
    label: "Português",
    short: "PT",
    flag: "https://flagcdn.com/w40/pt.png",
  },
  {
    code: "es",
    label: "Español",
    short: "ES",
    flag: "https://flagcdn.com/w40/es.png",
  },
];

const localeCodes = languages.map((language) => language.code);

function getCurrentLocale(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return localeCodes.includes(firstSegment) ? firstSegment : "en";
}

function removeLocaleFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (localeCodes.includes(segments[0])) {
    const pathWithoutLocale = "/" + segments.slice(1).join("/");
    return pathWithoutLocale === "/" ? "/" : pathWithoutLocale;
  }

  return pathname;
}

function buildLocalizedPath(pathname: string, locale: string) {
  const pathWithoutLocale = removeLocaleFromPath(pathname);

  if (locale === "en") {
    return pathWithoutLocale || "/";
  }

  if (pathWithoutLocale === "/" || pathWithoutLocale === "") {
    return `/${locale}`;
  }

  return `/${locale}${pathWithoutLocale}`;
}

function buildStaticLocalizedPath(path: string, locale: string) {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

function getInitials(user: SimulatedUser) {
  const first = user.firstName?.trim()?.[0] ?? "";
  const last = user.lastName?.trim()?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "U";
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SimulatedUser | null>(null);
  
  const searchParams = useSearchParams();

  const pathname = usePathname();
  const router = useRouter();

  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  const navItems = [
    { href: "/", label: t.header.home },
    { href: "/services", label: t.header.services },
    { href: "/villas", label: t.header.villas },
    { href: "/swimmingpools", label: t.header.swimmingpool },
    { href: "/activities", label: t.header.activities },
    { href: "/transportation", label: t.header.transportation },
    { href: "/about", label: t.header.about },
    { href: "/contact", label: t.header.contact },
  ];

  const currentLocale = getCurrentLocale(pathname);
  const currentLanguage =
    languages.find((language) => language.code === currentLocale) ??
    languages[0];

  useEffect(() => {
    function loadUser() {
      const storedUser = localStorage.getItem("kech_user");

      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("kech_user");
        setUser(null);
      }
    }

    loadUser();

    window.addEventListener("kech-auth-change", loadUser);
    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("kech-auth-change", loadUser);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("auth") === "login") {
      setAuthOpen(true);
    }
  }, [searchParams]);

  function changeLanguage(locale: string) {
    const targetPath = buildLocalizedPath(pathname, locale);
    
    setLanguageOpen(false);
    setMenuOpen(false);
    setUserMenuOpen(false);

    window.location.href = targetPath;
  }

  function logout() {
    localStorage.removeItem("kech_user");
    window.dispatchEvent(new Event("kech-auth-change"));
    setUser(null);
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push(buildStaticLocalizedPath("/", currentLocale));
  }

  function goToAccount(section: "profile" | "preferences") {
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push(buildStaticLocalizedPath(`/account?section=${section}`, currentLocale));
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link
            href={currentLocale === "en" ? "/" : `/${currentLocale}`}
            className="flex items-center gap-2"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-600 text-lg font-black text-white">
              K
            </div>

            <div>
              <p className="text-lg font-black tracking-tight text-zinc-950">
                Moorish Concierge
              </p>
              <p className="-mt-1 text-xs font-medium text-orange-700">
                Marrakech concierge services
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-semibold text-zinc-700 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={buildLocalizedPath(item.href, currentLocale)}
                className="transition hover:text-orange-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLanguageOpen((current) => !current);
                  setUserMenuOpen(false);
                }}
                className="flex h-[42px] min-w-[100px] items-center justify-between gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 text-sm font-black text-orange-800 transition hover:bg-orange-100"
              >
                <span className="flex items-center gap-2">
                  <Image
                    src={currentLanguage.flag}
                    alt={`${currentLanguage.label} flag`}
                    width={22}
                    height={16}
                    className="h-4 w-6 rounded-sm object-cover"
                    unoptimized
                  />
                  <span>{currentLanguage.short}</span>
                </span>

                <ChevronDown size={15} />
              </button>

              {languageOpen && (
                <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-orange-100 bg-white p-2 shadow-xl">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => changeLanguage(language.code)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                        currentLanguage.code === language.code
                          ? "bg-orange-50 text-orange-800"
                          : "text-zinc-700 hover:bg-orange-50 hover:text-orange-800"
                      }`}
                    >
                      <Image
                        src={language.flag}
                        alt={`${language.label} flag`}
                        width={22}
                        height={16}
                        className="h-4 w-6 rounded-sm object-cover"
                        unoptimized
                      />

                      <span>{language.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen((current) => !current);
                    setLanguageOpen(false);
                  }}
                  className="flex h-[42px] items-center gap-2 rounded-full border border-orange-100 bg-orange-50 pl-1 pr-3 font-black text-orange-800 transition hover:bg-orange-100"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">
                    {getInitials(user)}
                  </span>

                  <ChevronDown size={15} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-orange-100 bg-white p-2 shadow-xl">
                    <div className="border-b border-orange-100 px-3 py-3">
                      <p className="font-black text-zinc-950">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-sm text-zinc-500">
                        {user.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => goToAccount("profile")}
                      className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-zinc-700 transition hover:bg-orange-50 hover:text-orange-800"
                    >
                      {t.header.profile}
                    </button>

                    <button
                      type="button"
                      onClick={() => goToAccount("preferences")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-zinc-700 transition hover:bg-orange-50 hover:text-orange-800"
                    >
                      {t.header.preferences}
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      {t.header.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700"
              >
                <UserRound size={16} />
                {t.header.login}
              </button>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-orange-100 p-2 lg:hidden"
            aria-label="Open menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-orange-100 bg-white px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={buildLocalizedPath(item.href, currentLocale)}
                  onClick={() => setMenuOpen(false)}
                  className="font-semibold text-zinc-800"
                >
                  {item.label}
                </Link>
              ))}

              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-orange-50 p-3">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => changeLanguage(language.code)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black ${
                      currentLanguage.code === language.code
                        ? "bg-orange-600 text-white"
                        : "bg-white text-orange-800"
                    }`}
                  >
                    <Image
                      src={language.flag}
                      alt={`${language.label} flag`}
                      width={22}
                      height={16}
                      className="h-4 w-6 rounded-sm object-cover"
                      unoptimized
                    />

                    <span>{language.short}</span>
                  </button>
                ))}
              </div>

              {user ? (
                <div className="rounded-2xl bg-orange-50 p-3">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">
                      {getInitials(user)}
                    </span>
                    <div>
                      <p className="font-black text-zinc-950">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-zinc-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => goToAccount("profile")}
                      className="rounded-xl bg-white px-4 py-3 text-left font-bold text-zinc-800"
                    >
                      Edit profile
                    </button>

                    <button
                      type="button"
                      onClick={() => goToAccount("preferences")}
                      className="rounded-xl bg-white px-4 py-3 text-left font-bold text-zinc-800"
                    >
                      Edit preferences
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                      className="rounded-xl bg-red-50 px-4 py-3 text-left font-bold text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthOpen(true);
                  }}
                  className="rounded-full bg-zinc-950 px-5 py-3 font-bold text-white"
                >
                  {t.header.login}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}