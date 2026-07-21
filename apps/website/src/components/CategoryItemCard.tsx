"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";
import {
  CatalogItem,
  ProductType,
} from "@/store/catalog.store";

type CategoryItemCardProps = {
  item: CatalogItem;
};

const categoryPaths: Record<ProductType, string> = {
  VILLA: "villas",
  TRANSPORTATION: "transportation",
  SWIMMINGPOOL: "swimmingpools",
  ACTIVITY: "activities",
  RESTAURANT: "restaurants",
  SPA: "spa",
};

function buildProductPath(
  locale: string,
  item: CatalogItem
) {
  const category = categoryPaths[item.type];

  const basePath = `/${category}/${item.uniqueCode}`;

  return locale === "en"
    ? basePath
    : `/${locale}${basePath}`;
}

export default function CategoryItemCard({
  item,
}: CategoryItemCardProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  const productPath = buildProductPath(
    locale,
    item
  );

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={productPath}
        className="block"
      >
        <div className="relative h-64 overflow-hidden">
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-500 hover:scale-105"
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-black text-zinc-950">
              {item.title}
            </h2>

            <div className="shrink-0 text-right">
              <p className="text-xs font-bold text-zinc-500">
                {item.priceTitle}
              </p>

              <p className="text-xl font-black text-orange-700">
                €{item.priceEuro}
              </p>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 leading-6 text-zinc-600">
            {item.subtitle}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-zinc-500">
            <MapPin
              size={16}
              className="text-orange-600"
            />

            <span>{item.address}</span>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 font-black text-orange-700">
            <span>{t.categories.explore}</span>
            <ArrowRight size={17} />
          </div>
        </div>
      </Link>
    </article>
  );
}