"use client";

import Image from "next/image";
import Link from "next/link";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  ChevronDown,
  Loader2,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import AuthModal from "./AuthModal";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

import {
  useAuthStore,
} from "@/store/auth.store";

type HeaderUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

type AccountSection =
  | "profile"
  | "preferences";

const languages = [
  {
    code: "en",
    label: "English",
    short: "EN",
    flag:
      "https://flagcdn.com/w40/gb.png",
  },
  {
    code: "fr",
    label: "Français",
    short: "FR",
    flag:
      "https://flagcdn.com/w40/fr.png",
  },
  {
    code: "de",
    label: "Deutsch",
    short: "DE",
    flag:
      "https://flagcdn.com/w40/de.png",
  },
  {
    code: "it",
    label: "Italiano",
    short: "IT",
    flag:
      "https://flagcdn.com/w40/it.png",
  },
  {
    code: "pt",
    label: "Português",
    short: "PT",
    flag:
      "https://flagcdn.com/w40/pt.png",
  },
  {
    code: "es",
    label: "Español",
    short: "ES",
    flag:
      "https://flagcdn.com/w40/es.png",
  },
] as const;

const localeCodes = languages.map(
  (language) => language.code
);

function getCurrentLocale(
  pathname: string
) {
  const firstSegment = pathname
    .split("/")
    .filter(Boolean)[0];

  return localeCodes.includes(
    firstSegment as
      (typeof localeCodes)[number]
  )
    ? firstSegment
    : "en";
}

function removeLocaleFromPath(
  pathname: string
) {
  const segments = pathname
    .split("/")
    .filter(Boolean);

  if (
    localeCodes.includes(
      segments[0] as
        (typeof localeCodes)[number]
    )
  ) {
    const pathWithoutLocale =
      "/" +
      segments
        .slice(1)
        .join("/");

    return pathWithoutLocale === "/"
      ? "/"
      : pathWithoutLocale;
  }

  return pathname;
}

function buildLocalizedPath(
  pathname: string,
  locale: string
) {
  const pathWithoutLocale =
    removeLocaleFromPath(pathname);

  if (locale === "en") {
    return pathWithoutLocale || "/";
  }

  if (
    pathWithoutLocale === "/" ||
    pathWithoutLocale === ""
  ) {
    return `/${locale}`;
  }

  return `/${locale}${pathWithoutLocale}`;
}

function buildStaticLocalizedPath(
  path: string,
  locale: string
) {
  if (locale === "en") {
    return path;
  }

  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}

function getInitials(
  user: HeaderUser
) {
  const first =
    user.firstName
      ?.trim()
      ?.[0] ?? "";

  const last =
    user.lastName
      ?.trim()
      ?.[0] ?? "";

  return (
    `${first}${last}`.toUpperCase() ||
    "U"
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [authOpen, setAuthOpen] =
    useState(false);

  const [
    languageOpen,
    setLanguageOpen,
  ] = useState(false);

  const [
    userMenuOpen,
    setUserMenuOpen,
  ] = useState(false);

  const [user, setUser] =
    useState<HeaderUser | null>(
      null
    );

  const [
    authResolved,
    setAuthResolved,
  ] = useState(false);

  /*
   * Stores the route currently being opened.
   *
   * null means that no header navigation
   * is currently pending.
   */
  const [
    pendingPath,
    setPendingPath,
  ] = useState<string | null>(
    null
  );

  const searchParams =
    useSearchParams();

  const pathname =
    usePathname();

  const router =
    useRouter();

  const locale =
    getLocaleFromPath(
      pathname
    );

  const t =
    getDictionary(locale);

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
      href: "/swimmingpools",
      label:
        t.header.swimmingpool,
    },
    {
      href: "/activities",
      label:
        t.header.activities,
    },
    {
      href: "/transportation",
      label:
        t.header.transportation,
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

  const currentLocale =
    getCurrentLocale(
      pathname
    );

  const currentLanguage =
    languages.find(
      (language) =>
        language.code ===
        currentLocale
    ) ?? languages[0];

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
    function loadUser() {
      const storedUser =
        localStorage.getItem(
          "kech_user"
        );

      const storedToken =
        localStorage.getItem(
          "kech_access_token"
        );

      if (
        !storedUser ||
        !storedToken
      ) {
        setUser(null);
        setAuthResolved(true);
        return;
      }

      try {
        const parsedUser =
          JSON.parse(
            storedUser
          ) as HeaderUser;

        setUser(parsedUser);
      } catch {
        localStorage.removeItem(
          "kech_user"
        );

        localStorage.removeItem(
          "kech_access_token"
        );

        setUser(null);
      } finally {
        setAuthResolved(true);
      }
    }

    loadUser();

    window.addEventListener(
      "kech-auth-change",
      loadUser
    );

    window.addEventListener(
      "storage",
      loadUser
    );

    return () => {
      window.removeEventListener(
        "kech-auth-change",
        loadUser
      );

      window.removeEventListener(
        "storage",
        loadUser
      );
    };
  }, []);

  useEffect(() => {
    if (
      searchParams.get("auth") ===
      "login"
    ) {
      setAuthOpen(true);
    }
  }, [searchParams]);

  function prefetchPath(
    targetPath: string
  ) {
    if (
      targetPath === pathname ||
      pendingPath
    ) {
      return;
    }

    router.prefetch(targetPath);
  }

  function navigateTo(
    targetPath: string
  ) {
    if (
      pendingPath ||
      targetPath === pathname
    ) {
      return;
    }

    setPendingPath(targetPath);
    setLanguageOpen(false);
    setUserMenuOpen(false);

    router.push(targetPath);
  }

  function changeLanguage(
    nextLocale: string
  ) {
    if (pendingPath) {
      return;
    }

    const targetPath =
      buildLocalizedPath(
        pathname,
        nextLocale
      );

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
    window.location.href =
      targetPath;
  }

  function logout() {
    if (pendingPath) {
      return;
    }

    useAuthStore
      .getState()
      .logout();

    setUser(null);
    setAuthResolved(true);
    setUserMenuOpen(false);
    setMenuOpen(false);

    const targetPath =
      buildStaticLocalizedPath(
        "/",
        currentLocale
      );

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

  function goToAccount(
    section: AccountSection
  ) {
    const targetPath =
      buildStaticLocalizedPath(
        `/account?section=${section}`,
        currentLocale
      );

    setUserMenuOpen(false);
    setMenuOpen(false);

    navigateTo(targetPath);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/90 backdrop-blur">
        {pendingPath && (
          <div className="absolute inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-orange-100">
            <div className="h-full w-1/3 animate-header-progress rounded-full bg-orange-600" />
          </div>
        )}

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => {
              const targetPath =
                currentLocale === "en"
                  ? "/"
                  : `/${currentLocale}`;

              navigateTo(
                targetPath
              );
            }}
            onMouseEnter={() => {
              const targetPath =
                currentLocale === "en"
                  ? "/"
                  : `/${currentLocale}`;

              prefetchPath(
                targetPath
              );
            }}
            onFocus={() => {
              const targetPath =
                currentLocale === "en"
                  ? "/"
                  : `/${currentLocale}`;

              prefetchPath(
                targetPath
              );
            }}
            disabled={
              Boolean(pendingPath)
            }
            className="flex items-center gap-2 text-left disabled:cursor-wait"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-orange-200 bg-orange-50 p-2 shadow-sm">
              <Image
                src="https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/9439a16a-b801-4983-24a3-04e000b8f400/public"
                alt=""
                width={32}
                height={32}
                className="ml-1 h-[22px] w-[22px] object-contain"
                priority
                unoptimized
              />
            </span>

            <span className="hidden text-left sm:block">
              <span className="block text-lg font-black tracking-tight text-zinc-950">
                Moorish Concierge
              </span>
              <span className="-mt-1 block text-xs font-medium text-orange-700">
                Marrakech concierge services
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-5 text-sm font-semibold text-zinc-700 lg:flex">
            {navItems.map(
              (item) => {
                const targetPath =
                  buildLocalizedPath(
                    item.href,
                    currentLocale
                  );

                const isLoading =
                  pendingPath ===
                  targetPath;

                return (
                  <button
                    key={
                      item.href
                    }
                    type="button"
                    onClick={() =>
                      navigateTo(
                        targetPath
                      )
                    }
                    onMouseEnter={() =>
                      prefetchPath(
                        targetPath
                      )
                    }
                    onFocus={() =>
                      prefetchPath(
                        targetPath
                      )
                    }
                    disabled={
                      Boolean(
                        pendingPath
                      )
                    }
                    className={`inline-flex items-center gap-1.5 transition ${
                      isLoading
                        ? "text-orange-700"
                        : "hover:text-orange-700"
                    } disabled:cursor-wait disabled:opacity-70`}
                  >
                    {isLoading && (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    )}

                    {item.label}
                  </button>
                );
              }
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (pendingPath) {
                    return;
                  }

                  setLanguageOpen(
                    (current) =>
                      !current
                  );

                  setUserMenuOpen(
                    false
                  );
                }}
                disabled={
                  Boolean(pendingPath)
                }
                className="flex h-[42px] min-w-[100px] items-center justify-between gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 text-sm font-black text-orange-800 transition hover:bg-orange-100 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex items-center gap-2">
                  <Image
                    src={
                      currentLanguage.flag
                    }
                    alt={`${currentLanguage.label} flag`}
                    width={22}
                    height={16}
                    className="h-4 w-6 rounded-sm object-cover"
                    unoptimized
                  />

                  <span>
                    {
                      currentLanguage.short
                    }
                  </span>
                </span>

                <ChevronDown
                  size={15}
                />
              </button>

              {languageOpen && (
                <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-orange-100 bg-white p-2 shadow-xl">
                  {languages.map(
                    (language) => {
                      const targetPath =
                        buildLocalizedPath(
                          pathname,
                          language.code
                        );

                      const isLoading =
                        pendingPath ===
                        targetPath;

                      return (
                        <button
                          key={
                            language.code
                          }
                          type="button"
                          onClick={() =>
                            changeLanguage(
                              language.code
                            )
                          }
                          disabled={
                            Boolean(
                              pendingPath
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                            currentLanguage.code ===
                            language.code
                              ? "bg-orange-50 text-orange-800"
                              : "text-zinc-700 hover:bg-orange-50 hover:text-orange-800"
                          } disabled:cursor-wait disabled:opacity-60`}
                        >
                          <Image
                            src={
                              language.flag
                            }
                            alt={`${language.label} flag`}
                            width={22}
                            height={16}
                            className="h-4 w-6 rounded-sm object-cover"
                            unoptimized
                          />

                          <span className="flex-1">
                            {
                              language.label
                            }
                          </span>

                          {isLoading && (
                            <Loader2
                              size={15}
                              className="animate-spin"
                            />
                          )}
                        </button>
                      );
                    }
                  )}
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
                    if (
                      pendingPath
                    ) {
                      return;
                    }

                    setUserMenuOpen(
                      (current) =>
                        !current
                    );

                    setLanguageOpen(
                      false
                    );
                  }}
                  disabled={
                    Boolean(pendingPath)
                  }
                  className="flex h-[42px] items-center gap-2 rounded-full border border-orange-100 bg-orange-50 pl-1 pr-3 font-black text-orange-800 transition hover:bg-orange-100 disabled:cursor-wait disabled:opacity-60"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">
                    {
                      getInitials(
                        user
                      )
                    }
                  </span>

                  <ChevronDown
                    size={15}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-orange-100 bg-white p-2 shadow-xl">
                    <div className="border-b border-orange-100 px-3 py-3">
                      <p className="font-black text-zinc-950">
                        {
                          user.firstName
                        }{" "}
                        {
                          user.lastName
                        }
                      </p>

                      <p className="truncate text-sm text-zinc-500">
                        {user.email}
                      </p>
                    </div>

                    <AccountMenuButton
                      label={
                        t.header.profile
                      }
                      targetPath={buildStaticLocalizedPath(
                        "/account?section=profile",
                        currentLocale
                      )}
                      pendingPath={
                        pendingPath
                      }
                      onPrefetch={
                        prefetchPath
                      }
                      onClick={() =>
                        goToAccount(
                          "profile"
                        )
                      }
                      className="mt-2"
                    />

                    <AccountMenuButton
                      label={
                        t.header.preferences
                      }
                      targetPath={buildStaticLocalizedPath(
                        "/account?section=preferences",
                        currentLocale
                      )}
                      pendingPath={
                        pendingPath
                      }
                      onPrefetch={
                        prefetchPath
                      }
                      onClick={() =>
                        goToAccount(
                          "preferences"
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={
                        logout
                      }
                      disabled={
                        Boolean(
                          pendingPath
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      {pendingPath && (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      )}

                      {
                        t.header.logout
                      }
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setAuthOpen(true)
                }
                disabled={
                  Boolean(pendingPath)
                }
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
              >
                <UserRound
                  size={16}
                />

                {t.header.login}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (pendingPath) {
                return;
              }

              setMenuOpen(
                (current) =>
                  !current
              );
            }}
            disabled={
              Boolean(pendingPath)
            }
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

        {menuOpen && (
          <div className="absolute inset-x-0 top-full z-50 h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain border-t border-orange-100 bg-white px-5 py-5 lg:hidden">
            <div className="flex min-h-full flex-col gap-4">
              {navItems.map(
                (item) => {
                  const targetPath =
                    buildLocalizedPath(
                      item.href,
                      currentLocale
                    );

                  const isLoading =
                    pendingPath ===
                    targetPath;

                  return (
                    <button
                      key={
                        item.href
                      }
                      type="button"
                      onClick={() =>
                        navigateTo(
                          targetPath
                        )
                      }
                      onMouseEnter={() =>
                        prefetchPath(
                          targetPath
                        )
                      }
                      onFocus={() =>
                        prefetchPath(
                          targetPath
                        )
                      }
                      disabled={
                        Boolean(
                          pendingPath
                        )
                      }
                      className={`order-3 flex items-center gap-2 rounded-xl px-2 py-2 text-left font-semibold ${
                        isLoading
                          ? "text-orange-700"
                          : "text-zinc-800"
                      } disabled:cursor-wait disabled:opacity-70`}
                    >
                      {isLoading && (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      )}

                      {item.label}
                    </button>
                  );
                }
              )}

              <div className="order-2 grid grid-cols-3 gap-2 rounded-2xl bg-orange-50 p-3">
                {languages.map(
                  (language) => (
                    <button
                      key={
                        language.code
                      }
                      type="button"
                      onClick={() =>
                        changeLanguage(
                          language.code
                        )
                      }
                      disabled={
                        Boolean(
                          pendingPath
                        )
                      }
                      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black ${
                        currentLanguage.code ===
                        language.code
                          ? "bg-orange-600 text-white"
                          : "bg-white text-orange-800"
                      } disabled:cursor-wait disabled:opacity-60`}
                    >
                      <Image
                        src={
                          language.flag
                        }
                        alt={`${language.label} flag`}
                        width={22}
                        height={16}
                        className="h-4 w-6 rounded-sm object-cover"
                        unoptimized
                      />

                      <span>
                        {
                          language.short
                        }
                      </span>
                    </button>
                  )
                )}
              </div>

              {!authResolved ? (
                <MobileAuthSkeleton />
              ) : user ? (
                <div className="order-1 rounded-2xl bg-orange-50 p-3">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">
                      {
                        getInitials(
                          user
                        )
                      }
                    </span>

                    <div className="min-w-0">
                      <p className="font-black text-zinc-950">
                        {
                          user.firstName
                        }{" "}
                        {
                          user.lastName
                        }
                      </p>

                      <p className="truncate text-sm text-zinc-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <MobileAccountButton
                      label={
                        t.header.profile
                      }
                      loading={
                        pendingPath ===
                        buildStaticLocalizedPath(
                          "/account?section=profile",
                          currentLocale
                        )
                      }
                      disabled={
                        Boolean(
                          pendingPath
                        )
                      }
                      onClick={() =>
                        goToAccount(
                          "profile"
                        )
                      }
                    />

                    <MobileAccountButton
                      label={
                        t.header.preferences
                      }
                      loading={
                        pendingPath ===
                        buildStaticLocalizedPath(
                          "/account?section=preferences",
                          currentLocale
                        )
                      }
                      disabled={
                        Boolean(
                          pendingPath
                        )
                      }
                      onClick={() =>
                        goToAccount(
                          "preferences"
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={
                        logout
                      }
                      disabled={
                        Boolean(
                          pendingPath
                        )
                      }
                      className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-left font-bold text-red-600 disabled:cursor-wait disabled:opacity-60"
                    >
                      {pendingPath && (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      )}

                      {
                        t.header.logout
                      }
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(
                      false
                    );

                    setAuthOpen(
                      true
                    );
                  }}
                  disabled={
                    Boolean(
                      pendingPath
                    )
                  }
                  className="order-1 rounded-full bg-zinc-950 px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {t.header.login}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal
        open={authOpen}
        onClose={() =>
          setAuthOpen(false)
        }
      />

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
          animation: header-progress
            1.15s ease-in-out infinite;
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
  onPrefetch: (
    path: string
  ) => void;
  onClick: () => void;
  className?: string;
}) {
  const isLoading =
    pendingPath === targetPath;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() =>
        onPrefetch(targetPath)
      }
      onFocus={() =>
        onPrefetch(targetPath)
      }
      disabled={
        Boolean(pendingPath)
      }
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
        isLoading
          ? "bg-orange-50 text-orange-800"
          : "text-zinc-700 hover:bg-orange-50 hover:text-orange-800"
      } disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {isLoading && (
        <Loader2
          size={15}
          className="animate-spin"
        />
      )}

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
        <Loader2
          size={16}
          className="animate-spin text-orange-700"
        />
      )}

      {label}
    </button>
  );
}
