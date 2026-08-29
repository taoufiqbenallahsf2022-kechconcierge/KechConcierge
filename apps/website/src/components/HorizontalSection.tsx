"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import ItemCard from "./ItemCard";
import { Category } from "@/types/catalog";
import { useHomeProductsStore } from "@/store/home-products.store";
import { getCategoryTranslations } from "@/lib/category-translations";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";

const categoryToApiKey: Record<string, string> = {
  villas: "villa",
  beachclubs: "swimmingpool",
  nightclubs: "nightclub",
  packs: "pack",
  experiences: "activity",
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
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

  const updateScrollAvailability = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) { setCanScrollLeft(false); setCanScrollRight(false); return; }
    const tolerance = 2;
    setCanScrollLeft(scroller.scrollLeft > tolerance);
    setCanScrollRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - tolerance);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollAvailability);
    const scroller = scrollerRef.current;
    if (!scroller) return () => cancelAnimationFrame(frame);
    const observer = new ResizeObserver(updateScrollAvailability);
    observer.observe(scroller);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [items.length, updateScrollAvailability]);

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
    <section className="mx-auto max-w-[1500px] px-5 py-12 xl:px-8">
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

        <div className="hidden items-center md:flex">
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
        <div className="relative">
          {canScrollLeft && <button type="button" onClick={() => scroll("left")} className="nightclub-carousel-arrow absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-zinc-100 bg-white/95 text-zinc-950 shadow-xl backdrop-blur transition hover:scale-105 hover:bg-orange-50 md:grid" aria-label="Previous products"><ChevronLeft /></button>}
          <div
            ref={scrollerRef}
            onScroll={updateScrollAvailability}
            className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-6"
          >
            {items.map((item, index) => (
              <div key={item.id} className="snap-start">
                <ItemCard item={item as any} locale={locale} priority={category === "restaurants" && index < 3}/>
              </div>
            ))}
          </div>
          {canScrollRight && <button type="button" onClick={() => scroll("right")} className="nightclub-carousel-arrow absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-zinc-100 bg-white/95 text-zinc-950 shadow-xl backdrop-blur transition hover:scale-105 hover:bg-orange-50 md:grid" aria-label="Next products"><ChevronRight /></button>}
        </div>
      )}

      <div className="flex gap-3 md:hidden">
        {canScrollLeft && <button
          onClick={() => scroll("left")}
          className="nightclub-carousel-arrow grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow"
        >
          <ChevronLeft />
        </button>}

        {canScrollRight && <button
          onClick={() => scroll("right")}
          className="nightclub-carousel-arrow grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow"
        >
          <ChevronRight />
        </button>}

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
