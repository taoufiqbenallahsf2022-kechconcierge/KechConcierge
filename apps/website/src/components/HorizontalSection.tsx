"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import ItemCard from "./ItemCard";
import { Category } from "@/types/catalog";
import { useHomeProductsStore } from "@/store/home-products.store";
import { getCategoryTranslations } from "@/lib/category-translations";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";

const categoryToApiKey: Record<string, string> = {
  villas: "villa",
  swimmingpools: "swimmingpool",
  activities: "activity",
  transportation: "transportation",
  spa: "spa",
  restaurants: "restaurant",
};

function HorizontalSectionSkeleton() {
  return (
    <div className="no-scrollbar flex gap-5 overflow-x-auto pb-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="w-[280px] shrink-0 overflow-hidden rounded-3xl bg-white card-shadow"
        >
          <div className="h-48 animate-pulse bg-zinc-200" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-24 animate-pulse rounded-full bg-zinc-200" />
            <div className="h-5 w-44 animate-pulse rounded-full bg-zinc-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-zinc-200" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HorizontalSection({ category }: { category: Category }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const lang = useMemo(() => {
    const firstSegment = pathname.split("/")[1];
    const langMap: Record<string,string> = {
      en: 'EN',
      fr: 'FR',
      de: 'DE',
      es: 'ES',
      pt: 'PT',
      it: 'IT',
    } 

    return langMap[firstSegment] || 'EN'
  }, [pathname])

  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);
  const { labels, descriptions } = getCategoryTranslations(t);

  const products = useHomeProductsStore((state) => state.products);
  const loading = useHomeProductsStore((state) => state.loading);
  const error = useHomeProductsStore((state) => state.error);
  const fetchHomeProducts = useHomeProductsStore(
    (state) => state.fetchHomeProducts
  );

  useEffect(() => {
    fetchHomeProducts(lang);
  }, [fetchHomeProducts]);

  const apiKey = categoryToApiKey[category];
  const items = apiKey && products ? products[apiKey as keyof typeof products] || [] : [];

  if (!loading && !error && items.length === 0) {
    return null;
  }

  function scroll(direction: "left" | "right") {
    scrollerRef.current?.scrollBy({
      left: direction === "right" ? 660 : -660,
      behavior: "smooth",
    });
  }

  function localizePath(path: string) {
    if (locale === "en") return path;
    return `/${locale}${path}`;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
            {t.categories.explore}
          </p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">
            {labels[category]}
          </h2>
          <p className="mt-2 max-w-2xl text-zinc-600">
            {descriptions[category]}
          </p>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => scroll("left")}
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow hover:bg-orange-50"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={() => scroll("right")}
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow hover:bg-orange-50"
          >
            <ChevronRight />
          </button>

          <Link
            href={localizePath(`/${category}`)}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
          >
            {t.categories.viewAll}
          </Link>
        </div>
      </div>

      {loading && <HorizontalSectionSkeleton />}

      {!loading && error && (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-6"
        >
          {items.map((item) => (
            <div key={item.id} className="snap-start">
              <ItemCard item={item as any}  locale={locale}/>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 md:hidden">
        <button
          onClick={() => scroll("left")}
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow"
        >
          <ChevronLeft />
        </button>

        <button
          onClick={() => scroll("right")}
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow"
        >
          <ChevronRight />
        </button>

        <Link
          href={localizePath(`/${category}`)}
          className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white"
        >
          {t.categories.viewAll}
        </Link>
      </div>
    </section>
  );
}