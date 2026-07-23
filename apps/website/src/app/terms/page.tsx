"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CalendarClock,
  CreditCard,
  Database,
  FileText,
  Handshake,
  Home,
  Mail,
  Megaphone,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

function localizePath(
  path: string,
  locale: string
) {
  return locale === "en"
    ? path
    : `/${locale}${path}`;
}

export default function TermsPage() {
  const pathname = usePathname();

  const locale =
    getLocaleFromPath(pathname);

  const t =
    getDictionary(locale);

  const contactPath =
    localizePath(
      "/contact",
      locale
    );

  const preferencesPath =
    localizePath(
      "/account?section=preferences",
      locale
    );

  const sections = [
    {
      id: "service",
      icon: Handshake,
      title:
        t.termsPage.sections.service.title,
      paragraphs:
        t.termsPage.sections.service
          .paragraphs,
    },
    {
      id: "account",
      icon: UserRoundCheck,
      title:
        t.termsPage.sections.account.title,
      paragraphs:
        t.termsPage.sections.account
          .paragraphs,
    },
    {
      id: "consent",
      icon: Megaphone,
      title:
        t.termsPage.sections.consent.title,
      paragraphs:
        t.termsPage.sections.consent
          .paragraphs,
    },
    {
      id: "bookings",
      icon: CalendarClock,
      title:
        t.termsPage.sections.bookings.title,
      paragraphs:
        t.termsPage.sections.bookings
          .paragraphs,
    },
    {
      id: "payments",
      icon: CreditCard,
      title:
        t.termsPage.sections.payments.title,
      paragraphs:
        t.termsPage.sections.payments
          .paragraphs,
    },
    {
      id: "providers",
      icon: BadgeCheck,
      title:
        t.termsPage.sections.providers.title,
      paragraphs:
        t.termsPage.sections.providers
          .paragraphs,
    },
    {
      id: "guest-conduct",
      icon: Home,
      title:
        t.termsPage.sections.conduct.title,
      paragraphs:
        t.termsPage.sections.conduct
          .paragraphs,
    },
    {
      id: "prohibited",
      icon: Ban,
      title:
        t.termsPage.sections.prohibited
          .title,
      paragraphs:
        t.termsPage.sections.prohibited
          .paragraphs,
    },
    {
      id: "liability",
      icon: AlertTriangle,
      title:
        t.termsPage.sections.liability.title,
      paragraphs:
        t.termsPage.sections.liability
          .paragraphs,
    },
    {
      id: "privacy",
      icon: Database,
      title:
        t.termsPage.sections.privacy.title,
      paragraphs:
        t.termsPage.sections.privacy
          .paragraphs,
    },
    {
      id: "security",
      icon: ShieldCheck,
      title:
        t.termsPage.sections.security.title,
      paragraphs:
        t.termsPage.sections.security
          .paragraphs,
    },
    {
      id: "rights",
      icon: Scale,
      title:
        t.termsPage.sections.rights.title,
      paragraphs:
        t.termsPage.sections.rights
          .paragraphs,
    },
    {
      id: "changes",
      icon: FileText,
      title:
        t.termsPage.sections.changes.title,
      paragraphs:
        t.termsPage.sections.changes
          .paragraphs,
    },
  ];

  return (
    <main>
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-orange-700">
            <FileText size={17} />

            {t.termsPage.eyebrow}
          </div>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight text-zinc-950 md:text-6xl">
            {t.termsPage.title}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-700">
            {t.termsPage.introduction}
          </p>

          <div className="mt-7 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm font-semibold leading-7 text-orange-900">
            {t.termsPage.importantNotice}
          </div>

          <p className="mt-6 text-sm font-semibold text-zinc-500">
            {t.termsPage.lastUpdated}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 card-shadow">
            <p className="font-black text-zinc-950">
              {t.termsPage.contents}
            </p>

            <nav className="mt-4 flex flex-col gap-2 text-sm">
              {sections.map(
                (section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="rounded-xl px-3 py-2 font-semibold text-zinc-600 transition hover:bg-orange-50 hover:text-orange-700"
                  >
                    {section.title}
                  </a>
                )
              )}
            </nav>
          </div>
        </aside>

        <div className="space-y-7">
          {sections.map(
            (section) => {
              const Icon =
                section.icon;

              return (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 rounded-[2rem] border border-zinc-200 bg-white p-6 card-shadow md:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                      <Icon size={22} />
                    </div>

                    <h2 className="pt-2 text-2xl font-black text-zinc-950">
                      {section.title}
                    </h2>
                  </div>

                  <div className="mt-6 space-y-4 text-base leading-8 text-zinc-700">
                    {section.paragraphs.map(
                      (
                        paragraph: string,
                        index: number
                      ) => (
                        <p key={index}>
                          {paragraph}
                        </p>
                      )
                    )}
                  </div>

                  {section.id ===
                    "consent" && (
                    <Link
                      href={
                        preferencesPath
                      }
                      className="mt-6 inline-flex rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
                    >
                      {
                        t.termsPage
                          .managePreferences
                      }
                    </Link>
                  )}
                </article>
              );
            }
          )}

          <div className="rounded-[2rem] bg-zinc-950 p-7 text-white md:p-9">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-orange-400">
                <Mail size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  {
                    t.termsPage
                      .contactTitle
                  }
                </h2>

                <p className="mt-3 max-w-2xl leading-7 text-zinc-300">
                  {
                    t.termsPage
                      .contactDescription
                  }
                </p>

                <Link
                  href={contactPath}
                  className="mt-6 inline-flex rounded-full bg-orange-600 px-6 py-3 font-black text-white transition hover:bg-orange-700"
                >
                  {
                    t.termsPage
                      .contactButton
                  }
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}