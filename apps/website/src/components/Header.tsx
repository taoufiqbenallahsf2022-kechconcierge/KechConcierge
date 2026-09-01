"use client";

import Image from "next/image";
import Link from "next/link";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";

import { Check, ChevronDown, ChevronLeft, ChevronRight, CircleUserRound, ConciergeBell, Home, Info, Loader2, Mail, Menu, UserRound, X } from "lucide-react";

import AuthModal from "./AuthModal";
import { TripHeaderButton } from "./TripExperience";

import { getDictionary, getLocaleFromPath } from "@/lib/i18n";

import { useAuthStore } from "@/store/auth.store";

type HeaderUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

type AccountSection = "profile" | "preferences";

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
] as const;

const localeCodes = languages.map((language) => language.code);

function getCurrentLocale(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  return localeCodes.includes(firstSegment as (typeof localeCodes)[number])
    ? firstSegment
    : "en";
}

function removeLocaleFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (localeCodes.includes(segments[0] as (typeof localeCodes)[number])) {
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
  if (locale === "en") {
    return path;
  }

  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}

function getInitials(user: HeaderUser) {
  const first = user.firstName?.trim()?.[0] ?? "";

  const last = user.lastName?.trim()?.[0] ?? "";

  return `${first}${last}`.toUpperCase() || "U";
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [authOpen, setAuthOpen] = useState(false);

  const [languageOpen, setLanguageOpen] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [user, setUser] = useState<HeaderUser | null>(null);
  const [pastHomepageHero, setPastHomepageHero] = useState(false);

  const [authResolved, setAuthResolved] = useState(false);

  /*
   * Stores the route currently being opened.
   *
   * null means that no header navigation
   * is currently pending.
   */
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const pathname = usePathname();

  const router = useRouter();

  const locale = getLocaleFromPath(pathname);
  const isHomepage = removeLocaleFromPath(pathname) === "/";

  const t = getDictionary(locale);

  const navItems = [
    {
      href: "/",
      label: t.header.home,
    },
    {
      href: "/services",
      label: t.header.services,
    },
    {
      href: "/villas",
      label: t.header.villas,
    },
    {
      href: "/beachclubs",
      label: "Beach Clubs",
    },
    {
      href: "/experiences",
      label: t.header.activities,
    },
    {
      href: "/transportation",
      label: t.header.transportation,
    },
    {
      href: "/about",
      label: t.header.about,
    },
    {
      href: "/contact",
      label: t.header.contact,
    },
  ];

  const mobileCategories = [
    { href: "/villas", label: t.header.villas, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=82&w=520" },
    { href: "/beachclubs", label: t.header.swimmingpool, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=82&w=520" },
    { href: "/restaurants", label: t.categories.restaurantsLabel, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=82&w=520" },
    { href: "/experiences", label: t.header.activities, image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&q=82&w=520" },
  ];

  const mobileNavItems = [navItems[0], navItems[1], navItems[5], navItems[6], navItems[7]];

  const currentLocale = getCurrentLocale(pathname);

  const currentLanguage =
    languages.find((language) => language.code === currentLocale) ??
    languages[0];

  /*
   * When the pathname changes, navigation
   * has completed. Remove the loading state.
   */
  useEffect(() => {
    setPendingPath(null);
    setMenuOpen(false);
    setUserMenuOpen(false);
    setLanguageOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHomepage) { setPastHomepageHero(false); return; }
    const updateHeader = () => setPastHomepageHero(window.scrollY >= Math.max(120, window.innerHeight - 140));
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    return () => { window.removeEventListener("scroll", updateHeader); window.removeEventListener("resize", updateHeader); };
  }, [isHomepage]);

  useEffect(() => {
    function loadUser() {
      const storedUser = localStorage.getItem("kech_user");

      const storedToken = localStorage.getItem("kech_access_token");

      if (!storedUser || !storedToken) {
        setUser(null);
        setAuthResolved(true);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser) as HeaderUser;

        setUser(parsedUser);
      } catch {
        localStorage.removeItem("kech_user");

        localStorage.removeItem("kech_access_token");

        setUser(null);
      } finally {
        setAuthResolved(true);
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

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function prefetchPath(targetPath: string) {
    if (targetPath === pathname || pendingPath) {
      return;
    }

    router.prefetch(targetPath);
  }

  function navigateTo(targetPath: string) {
    if (pendingPath || targetPath === pathname) {
      return;
    }

    setPendingPath(targetPath);
    setLanguageOpen(false);
    setUserMenuOpen(false);

    router.push(targetPath);
  }

  function changeLanguage(nextLocale: string) {
    if (pendingPath) {
      return;
    }

    const targetPath = buildLocalizedPath(pathname, nextLocale);

    if (targetPath === pathname) {
      setLanguageOpen(false);
      return;
    }

    setPendingPath(targetPath);
    setLanguageOpen(false);
    setMenuOpen(false);
    setUserMenuOpen(false);

    /*
     * Language changes use a complete page load
     * in your current implementation.
     */
    window.location.href = targetPath;
  }

  function logout() {
    if (pendingPath) {
      return;
    }

    useAuthStore.getState().logout();

    setUser(null);
    setAuthResolved(true);
    setUserMenuOpen(false);
    setMenuOpen(false);

    const targetPath = buildStaticLocalizedPath("/", currentLocale);

    /*
     * When logout happens on the localized home page,
     * navigating to targetPath is a no-op. In that case
     * there will be no pathname change to clear pendingPath.
     */
    if (targetPath === pathname) {
      setPendingPath(null);
      return;
    }

    setPendingPath(targetPath);
    router.replace(targetPath);
  }

  function goToAccount(section: AccountSection) {
    const targetPath = buildStaticLocalizedPath(
      `/account?section=${section}`,
      currentLocale,
    );

    setUserMenuOpen(false);
    setMenuOpen(false);

    navigateTo(targetPath);
  }

  return (
    <>
      <header className={`site-header top-0 ${menuOpen ? "z-[70]" : "z-40"} ${isHomepage ? "fixed inset-x-0" : "sticky"} ${isHomepage && !pastHomepageHero ? "home-header-dark border-transparent bg-transparent" : "border-b border-orange-100 bg-white/95 backdrop-blur"}`}>
        {pendingPath && (
          <div className="absolute inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-orange-100">
            <div className="h-full w-1/3 animate-header-progress rounded-full bg-orange-600" />
          </div>
        )}

        <div className="mx-auto flex max-w-[1380px] items-center justify-between px-5 py-4 xl:px-8">
          <button
            type="button"
            onClick={() => {
              const targetPath =
                currentLocale === "en" ? "/" : `/${currentLocale}`;

              navigateTo(targetPath);
            }}
            onMouseEnter={() => {
              const targetPath =
                currentLocale === "en" ? "/" : `/${currentLocale}`;

              prefetchPath(targetPath);
            }}
            onFocus={() => {
              const targetPath =
                currentLocale === "en" ? "/" : `/${currentLocale}`;

              prefetchPath(targetPath);
            }}
            disabled={Boolean(pendingPath)}
            className="relative flex h-10 w-12 items-center justify-start text-left disabled:cursor-wait sm:h-11 sm:w-14"
          >
            <Image
              src="/brand/original-m-mark.png"
              alt="Moorish Concierge Marrakech"
              width={500}
              height={500}
              className="site-logo-image site-logo-image-light h-10 w-10 object-contain sm:h-11 sm:w-11"
              priority
            />
            <Image
              src="/brand/original-m-mark.png"
              alt=""
              aria-hidden="true"
              width={500}
              height={500}
              className="site-logo-image site-logo-image-dark site-logo-image-dark-base absolute -left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 object-contain sm:h-11 sm:w-11"
              priority
            />
            <Image
              src="/brand/original-m-mark.png"
              alt=""
              aria-hidden="true"
              width={500}
              height={500}
              className="site-logo-image site-logo-image-dark site-logo-image-dark-accent absolute -left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 object-contain sm:h-11 sm:w-11"
              priority
            />
          </button>

          <nav className="primary-site-nav hidden items-center gap-5 text-sm font-semibold text-zinc-700 lg:flex">
            {navItems.map((item) => {
              const targetPath = buildLocalizedPath(item.href, currentLocale);

              const isLoading = pendingPath === targetPath;

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => navigateTo(targetPath)}
                  onMouseEnter={() => prefetchPath(targetPath)}
                  onFocus={() => prefetchPath(targetPath)}
                  disabled={Boolean(pendingPath)}
                  className={`inline-flex items-center gap-1.5 transition ${
                    isLoading ? "text-orange-700" : "hover:text-orange-700"
                  } disabled:cursor-wait disabled:opacity-70`}
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}

                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <TripHeaderButton />
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (pendingPath) {
                    return;
                  }

                  setLanguageOpen((current) => !current);

                  setUserMenuOpen(false);
                }}
                disabled={Boolean(pendingPath)}
                className="flex h-[42px] min-w-[100px] items-center justify-between gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 text-sm font-black text-orange-800 transition hover:bg-orange-100 disabled:cursor-wait disabled:opacity-60"
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
                  {languages.map((language) => {
                    const targetPath = buildLocalizedPath(
                      pathname,
                      language.code,
                    );

                    const isLoading = pendingPath === targetPath;

                    return (
                      <button
                        key={language.code}
                        type="button"
                        onClick={() => changeLanguage(language.code)}
                        disabled={Boolean(pendingPath)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                          currentLanguage.code === language.code
                            ? "bg-orange-50 text-orange-800"
                            : "text-zinc-700 hover:bg-orange-50 hover:text-orange-800"
                        } disabled:cursor-wait disabled:opacity-60`}
                      >
                        <Image
                          src={language.flag}
                          alt={`${language.label} flag`}
                          width={22}
                          height={16}
                          className="h-4 w-6 rounded-sm object-cover"
                          unoptimized
                        />

                        <span className="flex-1">{language.label}</span>

                        {isLoading && (
                          <Loader2 size={15} className="animate-spin" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!authResolved ? (
              <HeaderAuthSkeleton />
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (pendingPath) {
                      return;
                    }

                    setUserMenuOpen((current) => !current);

                    setLanguageOpen(false);
                  }}
                  disabled={Boolean(pendingPath)}
                  className="flex h-[42px] items-center gap-2 rounded-full border border-orange-100 bg-orange-50 pl-1 pr-3 font-black text-orange-800 transition hover:bg-orange-100 disabled:cursor-wait disabled:opacity-60"
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

                    <AccountMenuButton
                      label={t.header.profile}
                      targetPath={buildStaticLocalizedPath(
                        "/account?section=profile",
                        currentLocale,
                      )}
                      pendingPath={pendingPath}
                      onPrefetch={prefetchPath}
                      onClick={() => goToAccount("profile")}
                      className="mt-2"
                    />

                    <AccountMenuButton
                      label={t.header.preferences}
                      targetPath={buildStaticLocalizedPath(
                        "/account?section=preferences",
                        currentLocale,
                      )}
                      pendingPath={pendingPath}
                      onPrefetch={prefetchPath}
                      onClick={() => goToAccount("preferences")}
                    />

                    <button
                      type="button"
                      onClick={logout}
                      disabled={Boolean(pendingPath)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      {pendingPath && (
                        <Loader2 size={15} className="animate-spin" />
                      )}

                      {t.header.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                disabled={Boolean(pendingPath)}
                className="inline-grid h-[42px] w-[42px] place-items-center rounded-full bg-zinc-950 text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
                aria-label={t.header.login}
                title={t.header.login}
              >
                <UserRound size={19} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
          <TripHeaderButton />
          <button
            type="button"
            onClick={() => {
              if (pendingPath) {
                return;
              }

              setLanguageOpen(false);
              setMenuOpen((current) => !current);
            }}
            disabled={Boolean(pendingPath)}
            className="rounded-xl border border-orange-100 p-2 disabled:cursor-wait disabled:opacity-60 lg:hidden"
            aria-label="Open menu"
          >
            {pendingPath ? (
              <Loader2 className="animate-spin" />
            ) : menuOpen ? (
              <X />
            ) : (
              <Menu />
            )}
          </button>
          </div>
        </div>

        {menuOpen && (
          <div className="no-scrollbar absolute inset-x-0 top-full h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-orange-100 bg-[#fffaf6] px-4 pb-8 pt-4 shadow-2xl md:hidden">
            {languageOpen ? (
              <div className="mx-auto w-full max-w-lg">
                <button type="button" onClick={() => setLanguageOpen(false)} className="mb-4 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 font-bold text-zinc-900 shadow-sm">
                  <ChevronLeft size={19} /> Language
                </button>
                <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-2 shadow-sm">
                  {languages.map((language) => {
                    const selected = currentLanguage.code === language.code;
                    return <button key={language.code} type="button" onClick={() => changeLanguage(language.code)} disabled={Boolean(pendingPath)} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${selected ? "bg-orange-50 text-orange-800" : "text-zinc-900 hover:bg-orange-50"}`}>
                      <Image src={language.flag} alt="" width={28} height={20} className="h-5 w-7 rounded object-cover" unoptimized />
                      <span className="flex-1">{language.label}</span>
                      {selected && <Check size={19} className="text-orange-600" />}
                    </button>;
                  })}
                </div>
              </div>
            ) : (
            <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
              <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
                {mobileCategories.map((item) => {
                  const targetPath = buildLocalizedPath(item.href, currentLocale);
                  return <button key={item.href} type="button" onClick={() => navigateTo(targetPath)} disabled={Boolean(pendingPath)} className="w-[34%] max-w-[140px] shrink-0 snap-start overflow-hidden rounded-2xl border border-black/5 bg-white text-left shadow-sm transition active:scale-[.98]">
                    <span className="relative block h-20 overflow-hidden bg-[#eee8e3]"><Image src={item.image} alt="" fill sizes="140px" className="object-cover transition duration-500 hover:scale-105" /></span>
                    <span className="flex min-h-12 items-center justify-between gap-1.5 px-3 py-2.5 text-xs font-black text-zinc-950"><span className="truncate">{item.label}</span><ChevronRight size={15} className="shrink-0 text-orange-600" /></span>
                  </button>;
                })}
              </div>

              <nav className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-2 shadow-sm">
              {mobileNavItems.map((item) => {
                const targetPath = buildLocalizedPath(item.href, currentLocale);

                const isLoading = pendingPath === targetPath;

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigateTo(targetPath)}
                    onMouseEnter={() => prefetchPath(targetPath)}
                    onFocus={() => prefetchPath(targetPath)}
                    disabled={Boolean(pendingPath)}
                    className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left font-bold transition ${
                      isLoading ? "bg-orange-50 text-orange-700" : "text-zinc-900 hover:bg-orange-50"
                    } disabled:cursor-wait disabled:opacity-70`}
                  >
                    {isLoading && (
                      <Loader2 size={16} className="animate-spin" />
                    )}

                    <span className="flex items-center gap-3">{item.href === "/" ? <Home size={19} /> : item.href === "/about" ? <Info size={19} /> : item.href === "/contact" ? <Mail size={19} /> : <ConciergeBell size={19} />} {item.label}</span>
                    <ChevronRight size={18} className="text-zinc-400" />
                  </button>
                );
              })}
              </nav>

              <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-2 shadow-sm">
                {!authResolved ? <MobileAuthSkeleton /> : <button type="button" onClick={() => { if (user) goToAccount("profile"); else { setMenuOpen(false); setAuthOpen(true); } }} className="flex min-h-16 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-orange-50">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange-50 font-black text-orange-700">{user ? getInitials(user) : <CircleUserRound size={24} />}</span>
                  <span className="min-w-0 flex-1"><span className="block font-black text-zinc-950">{user ? `${user.firstName} ${user.lastName}` : "Account"}</span><span className="block truncate text-sm text-zinc-500">{user ? user.email : t.header.login}</span></span><ChevronRight size={18} className="text-zinc-400" />
                </button>}
                <div className="mx-3 border-t border-zinc-100" />
                <button type="button" onClick={() => setLanguageOpen(true)} className="flex min-h-16 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-orange-50">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange-50"><Image src={currentLanguage.flag} alt="" width={26} height={19} className="h-[19px] w-[26px] rounded object-cover" unoptimized /></span>
                  <span className="flex-1"><span className="block font-black text-zinc-950">Language</span><span className="block text-sm text-zinc-500">{currentLanguage.label}</span></span><ChevronRight size={18} className="text-zinc-400" />
                </button>
              </div>

              <button type="button" onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent("moorish-open-contact")); }} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 px-5 py-4 font-black text-white shadow-lg shadow-orange-600/20 transition active:scale-[.98]">
                <ConciergeBell size={21} /> Contact concierge
              </button>
            </div>
            )}
          </div>
        )}

        {menuOpen && (
          <div className="no-scrollbar absolute inset-x-0 top-full hidden h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-orange-100 bg-white px-5 py-5 md:block lg:hidden">
            <div className="flex min-h-full flex-col gap-4">
              {navItems.map((item) => {
                const targetPath = buildLocalizedPath(item.href, currentLocale);
                const isLoading = pendingPath === targetPath;
                return <button key={item.href} type="button" onClick={() => navigateTo(targetPath)} onMouseEnter={() => prefetchPath(targetPath)} onFocus={() => prefetchPath(targetPath)} disabled={Boolean(pendingPath)} className={`order-3 flex items-center gap-2 rounded-xl px-2 py-2 text-left font-semibold ${isLoading ? "text-orange-700" : "text-zinc-800"} disabled:cursor-wait disabled:opacity-70`}>
                  {isLoading && <Loader2 size={16} className="animate-spin" />}{item.label}
                </button>;
              })}

              <div className="order-2 grid grid-cols-3 gap-2 rounded-2xl bg-orange-50 p-3">
                {languages.map((language) => <button key={language.code} type="button" onClick={() => changeLanguage(language.code)} disabled={Boolean(pendingPath)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black ${currentLanguage.code === language.code ? "bg-orange-600 text-white" : "bg-white text-orange-800"}`}>
                  <Image src={language.flag} alt={`${language.label} flag`} width={22} height={16} className="h-4 w-6 rounded-sm object-cover" unoptimized /><span>{language.short}</span>
                </button>)}
              </div>

              {!authResolved ? <MobileAuthSkeleton /> : user ? (
                <div className="order-1 rounded-2xl bg-orange-50 p-3">
                  <div className="mb-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">{getInitials(user)}</span><div className="min-w-0"><p className="font-black text-zinc-950">{user.firstName} {user.lastName}</p><p className="truncate text-sm text-zinc-500">{user.email}</p></div></div>
                  <div className="grid gap-2"><MobileAccountButton label={t.header.profile} loading={pendingPath === buildStaticLocalizedPath("/account?section=profile", currentLocale)} disabled={Boolean(pendingPath)} onClick={() => goToAccount("profile")} /><MobileAccountButton label={t.header.preferences} loading={pendingPath === buildStaticLocalizedPath("/account?section=preferences", currentLocale)} disabled={Boolean(pendingPath)} onClick={() => goToAccount("preferences")} /><button type="button" onClick={logout} disabled={Boolean(pendingPath)} className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-left font-bold text-red-600">{pendingPath && <Loader2 size={16} className="animate-spin" />}{t.header.logout}</button></div>
                </div>
              ) : <button type="button" onClick={() => { setMenuOpen(false); setAuthOpen(true); }} disabled={Boolean(pendingPath)} className="order-1 rounded-full bg-zinc-950 px-5 py-3 font-bold text-white">{t.header.login}</button>}
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <style jsx global>{`
        @keyframes header-progress {
          0% {
            transform: translateX(-120%);
          }

          50% {
            transform: translateX(120%);
          }

          100% {
            transform: translateX(320%);
          }
        }

        .animate-header-progress {
          animation: header-progress 1.15s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

function HeaderAuthSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-[42px] w-[116px] animate-pulse rounded-full bg-zinc-200"
    />
  );
}

function MobileAuthSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="order-1 h-12 w-full animate-pulse rounded-full bg-zinc-200"
    />
  );
}

function AccountMenuButton({
  label,
  targetPath,
  pendingPath,
  onPrefetch,
  onClick,
  className = "",
}: {
  label: string;
  targetPath: string;
  pendingPath: string | null;
  onPrefetch: (path: string) => void;
  onClick: () => void;
  className?: string;
}) {
  const isLoading = pendingPath === targetPath;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onPrefetch(targetPath)}
      onFocus={() => onPrefetch(targetPath)}
      disabled={Boolean(pendingPath)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
        isLoading
          ? "bg-orange-50 text-orange-800"
          : "text-zinc-700 hover:bg-orange-50 hover:text-orange-800"
      } disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {isLoading && <Loader2 size={15} className="animate-spin" />}

      {label}
    </button>
  );
}

function MobileAccountButton({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-left font-bold text-zinc-800 disabled:cursor-wait disabled:opacity-70"
    >
      {loading && (
        <Loader2 size={16} className="animate-spin text-orange-700" />
      )}

      {label}
    </button>
  );
}
