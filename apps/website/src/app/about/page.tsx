"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BedDouble,
  CarFront,
  Compass,
  Eye,
  HeartHandshake,
  MapPinned,
  MessageCircle,
  MoonStar,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

function buildLocalizedPath(
  locale: string,
  path: string
) {
  return locale === "en"
    ? path
    : `/${locale}${path}`;
}

export default function AboutPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  const servicesPath = buildLocalizedPath(
    locale,
    "/services"
  );

  const contactPath = buildLocalizedPath(
    locale,
    "/contact"
  );

  const chatPath = buildLocalizedPath(
    locale,
    "/chat"
  );

  const services = [
    {
      icon: BedDouble,
      title:
        t.aboutPage.services.stays.title,
      description:
        t.aboutPage.services.stays
          .description,
    },
    {
      icon: CarFront,
      title:
        t.aboutPage.services.transportation
          .title,
      description:
        t.aboutPage.services.transportation
          .description,
    },
    {
      icon: Compass,
      title:
        t.aboutPage.services.experiences
          .title,
      description:
        t.aboutPage.services.experiences
          .description,
    },
    {
      icon: Waves,
      title:
        t.aboutPage.services.pools.title,
      description:
        t.aboutPage.services.pools
          .description,
    },
    {
      icon: UtensilsCrossed,
      title:
        t.aboutPage.services.dining.title,
      description:
        t.aboutPage.services.dining
          .description,
    },
    {
      icon: MoonStar,
      title:
        t.aboutPage.services.nightlife
          .title,
      description:
        t.aboutPage.services.nightlife
          .description,
    },
    {
      icon: Sparkles,
      title:
        t.aboutPage.services.wellness.title,
      description:
        t.aboutPage.services.wellness
          .description,
    },
    {
      icon: MessageCircle,
      title:
        t.aboutPage.services.concierge.title,
      description:
        t.aboutPage.services.concierge
          .description,
    },
  ];

  const principles = [
    {
      icon: Eye,
      title:
        t.aboutPage.principles.local.title,
      description:
        t.aboutPage.principles.local
          .description,
    },
    {
      icon: ShieldCheck,
      title:
        t.aboutPage.principles.trusted.title,
      description:
        t.aboutPage.principles.trusted
          .description,
    },
    {
      icon: HeartHandshake,
      title:
        t.aboutPage.principles.personal.title,
      description:
        t.aboutPage.principles.personal
          .description,
    },
  ];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-orange-100 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-zinc-100 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 md:py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-orange-700">
              <MapPinned size={16} />

              {t.aboutPage.eyebrow}
            </div>

            <h1 className="mt-7 text-5xl font-black leading-tight text-zinc-950 md:text-7xl">
              {t.aboutPage.title}
            </h1>

            <p className="mt-7 max-w-3xl text-xl leading-9 text-zinc-700">
              {t.aboutPage.heroDescription}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={servicesPath}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 font-black text-white transition hover:bg-orange-700"
              >
                {t.aboutPage.exploreServices}

                <ArrowRight size={18} />
              </Link>

              <Link
                href={contactPath}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-7 py-4 font-black text-zinc-950 transition hover:border-orange-300 hover:text-orange-700"
              >
                {t.aboutPage.contactUs}
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <p className="text-3xl font-black text-orange-700">
                Marrakech
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">
                {t.aboutPage.highlights.location}
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <p className="text-3xl font-black text-orange-700">
                7/7
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">
                {t.aboutPage.highlights.availability}
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <p className="text-3xl font-black text-orange-700">
                Local
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">
                {t.aboutPage.highlights.localKnowledge}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-24 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
            {t.aboutPage.storyEyebrow}
          </p>

          <h2 className="mt-4 text-4xl font-black leading-tight text-zinc-950">
            {t.aboutPage.storyTitle}
          </h2>
        </div>

        <div className="space-y-6 text-lg leading-8 text-zinc-700">
          <p>
            {t.aboutPage.storyParagraph1}
          </p>

          <p>
            {t.aboutPage.storyParagraph2}
          </p>

          <p>
            {t.aboutPage.storyParagraph3}
          </p>
        </div>
      </section>

      <section className="bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-400">
              {t.aboutPage.servicesEyebrow}
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
              {t.aboutPage.servicesTitle}
            </h2>

            <p className="mt-5 text-lg leading-8 text-zinc-300">
              {t.aboutPage.servicesDescription}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <div
                  key={service.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-orange-400/40 hover:bg-white/10"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/15 text-orange-400">
                    <Icon size={22} />
                  </div>

                  <h3 className="mt-5 text-xl font-black text-white">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
            {t.aboutPage.principlesEyebrow}
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight text-zinc-950 md:text-5xl">
            {t.aboutPage.principlesTitle}
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {principles.map((principle) => {
            const Icon = principle.icon;

            return (
              <div
                key={principle.title}
                className="rounded-[2rem] border border-zinc-200 bg-white p-8 card-shadow"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                  <Icon size={24} />
                </div>

                <h3 className="mt-6 text-2xl font-black text-zinc-950">
                  {principle.title}
                </h3>

                <p className="mt-4 leading-7 text-zinc-600">
                  {principle.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-600 to-orange-700 px-6 py-12 text-white md:px-12 md:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">
                {t.aboutPage.ctaEyebrow}
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight">
                {t.aboutPage.ctaTitle}
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-orange-50">
                {t.aboutPage.ctaDescription}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href={chatPath}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-black text-orange-700 transition hover:bg-orange-50"
              >
                {t.aboutPage.openConcierge}

                <ArrowRight size={18} />
              </Link>

              <Link
                href={contactPath}
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-7 py-4 font-black text-white transition hover:bg-white/10"
              >
                {t.aboutPage.sendRequest}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}