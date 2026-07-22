"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

import {
  categoryLabels,
} from "@/lib/catalog";

import type {
  Category,
} from "@/types/catalog";

type ServiceTranslationKey =
  | "villa"
  | "transportation"
  | "swimmingpool"
  | "activity"
  | "restaurant"
  | "spa";

const categories =
  Object.keys(
    categoryLabels
  ) as Category[];

const CATEGORY_TRANSLATION_KEYS: Record<
  Category,
  ServiceTranslationKey
> = {
  villas: "villa",
  transportation: "transportation",
  swimmingpools: "swimmingpool",
  activities: "activity",
  restaurants: "restaurant",
  spa: "spa",
};

function buildCategoryPath(
  locale: string,
  category: Category
) {
  return locale === "en"
    ? `/${category}`
    : `/${locale}/${category}`;
}

export default function ServicesPage() {
  const pathname =
    usePathname();

  const locale =
    getLocaleFromPath(
      pathname
    );

  const t =
    getDictionary(locale);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
        {t.servicesPage.eyebrow}
      </p>

      <h1 className="mt-3 max-w-4xl text-5xl font-black text-zinc-950">
        {t.servicesPage.title}
      </h1>

      <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
        {t.servicesPage.description}
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(
          (category) => {
            const translationKey =
              CATEGORY_TRANSLATION_KEYS[
                category
              ];

            const categoryContent =
              t.servicesPage.categories[
                translationKey
              ];

            return (
              <Link
                key={category}
                href={buildCategoryPath(
                  locale,
                  category
                )}
                className="rounded-3xl bg-white p-7 card-shadow transition hover:-translate-y-1"
              >
                <p className="text-2xl font-black text-zinc-950">
                  {
                    categoryContent.label
                  }
                </p>

                <p className="mt-3 leading-7 text-zinc-600">
                  {
                    categoryContent.description
                  }
                </p>

                <p className="mt-5 font-black text-orange-700">
                  {
                    t.servicesPage
                      .viewOptions
                  }{" "}
                  →
                </p>
              </Link>
            );
          }
        )}
      </div>
    </section>
  );
}