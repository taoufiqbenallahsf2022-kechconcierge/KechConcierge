"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import ItemCard from "./ItemCard";
import { Category } from "@/types/catalog";
import { categoryDescriptions, categoryLabels, getFeaturedItems } from "@/lib/catalog";

export default function HorizontalSection({ category }: { category: Category }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const items = getFeaturedItems(category, 10);

  function scroll(direction: "left" | "right") {
    scrollerRef.current?.scrollBy({
      left: direction === "right" ? 660 : -660,
      behavior: "smooth"
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">Explore</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">{categoryLabels[category]}</h2>
          <p className="mt-2 max-w-2xl text-zinc-600">{categoryDescriptions[category]}</p>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button onClick={() => scroll("left")} className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow hover:bg-orange-50">
            <ChevronLeft />
          </button>
          <button onClick={() => scroll("right")} className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow hover:bg-orange-50">
            <ChevronRight />
          </button>
          <Link href={`/${category}`} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700">
            View all
          </Link>
        </div>
      </div>

      <div ref={scrollerRef} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-6">
        {items.map((item) => (
          <div key={item.id} className="snap-start">
            <ItemCard item={item} />
          </div>
        ))}
      </div>

      <div className="flex gap-3 md:hidden">
        <button onClick={() => scroll("left")} className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow">
          <ChevronLeft />
        </button>
        <button onClick={() => scroll("right")} className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 card-shadow">
          <ChevronRight />
        </button>
        <Link href={`/${category}`} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white">
          View all
        </Link>
      </div>
    </section>
  );
}
