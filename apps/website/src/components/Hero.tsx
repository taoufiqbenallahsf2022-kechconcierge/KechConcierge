"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";

function localizePath(path: string, locale: string) {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export default function Hero() { 
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  return (
    <section className="orange-gradient">
      <div className="mx-auto grid min-h-[720px] max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-black text-orange-700">
            <Sparkles size={16} />
            {t.hero.eyebrow}
          </div>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
            {t.hero.title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
            {t.hero.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={localizePath("/villas", locale)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 font-black text-white transition hover:bg-orange-700"
            >
              {t.hero.exploreVillas}
              <ArrowRight size={18} />
            </Link>

            <Link
              href={localizePath("/services", locale)}
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-7 py-4 font-black text-zinc-950 transition hover:border-orange-300 hover:bg-orange-50"
            >
              {t.hero.viewServices}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="relative h-[540px] overflow-hidden rounded-[2.5rem] card-shadow">
            <Image
              src="https://images.unsplash.com/photo-1653323792487-6ecc6217040b"
              alt={t.hero.imageAlt}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="absolute -bottom-8 left-6 rounded-3xl bg-white p-5 card-shadow">
            <p className="text-sm font-bold text-zinc-500">
              {t.hero.startingFrom}
            </p>
            <p className="text-3xl font-black text-orange-700">
              {t.hero.price}
            </p>
            <p className="text-sm font-semibold text-zinc-700">
              {t.hero.priceDescription}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}