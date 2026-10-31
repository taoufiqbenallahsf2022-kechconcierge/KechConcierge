"use client";

import ProgressiveImage from "./ProgressiveImage";

import {
  ArrowRight,
  Loader2,
  MapPin,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useState,
} from "react";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

import {
  CatalogItem,
  ProductType,
} from "@/store/catalog.store";

type CategoryItemCardProps = {
  item: CatalogItem;
  priority?: boolean;
};

const categoryPaths: Record<
  ProductType,
  string
> = {
  VILLA: "villas",
  TRANSPORTATION:
    "transportation",
  SWIMMINGPOOL:
    "beachclubs",
  NIGHTCLUB: "nightclubs",
  PACK: "packs",
  ACTIVITY: "experiences",
  RESTAURANT:
    "restaurants",
  SPA: "spa",
};

function buildProductPath(
  locale: string,
  item: CatalogItem
) {
  const category =
    categoryPaths[item.type];

  const basePath =
    `/${category}/${item.uniqueCode}`;

  return locale === "en"
    ? basePath
    : `/${locale}${basePath}`;
}

export default function CategoryItemCard({
  item,
  priority = false,
}: CategoryItemCardProps) {
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

  const [loading, setLoading] =
    useState(false);

  const productPath =
    buildProductPath(
      locale,
      item
    );

  function openProduct() {
    if (loading) {
      return;
    }

    setLoading(true);

    router.push(
      productPath,
      { scroll: true }
    );
  }

  function prefetchProduct() {
    if (!loading) {
      router.prefetch(
        productPath
      );
    }
  }

  return (
    <article
      className={`relative overflow-hidden rounded-3xl bg-white shadow-sm transition ${
        loading
          ? "cursor-wait"
          : "hover:-translate-y-1 hover:shadow-lg"
      }`}
    >
      <button
        type="button"
        onClick={openProduct}
        onMouseEnter={
          prefetchProduct
        }
        onFocus={prefetchProduct}
        disabled={loading}
        aria-busy={loading}
        className="flex h-full w-full flex-col text-left disabled:cursor-wait"
      >
        <div className="relative h-64 w-full shrink-0 overflow-hidden">
          <ProgressiveImage
            src={item.thumbnail}
            alt={item.thumbnailAlt || item.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition duration-500 ${
              loading
                ? "scale-105 opacity-70"
                : "hover:scale-105"
            }`}
          />

          {loading && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-zinc-950/45 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3 text-white">
                <Loader2
                  size={32}
                  className="animate-spin"
                />

                <span className="text-sm font-black">
                  Opening...
                </span>
              </div>
            </div>
          )}
        </div>

        <div
          className={`flex w-full flex-1 flex-col p-5 transition ${
            loading
              ? "opacity-70"
              : ""
          }`}
        >
            <h2 className="text-xl font-black leading-7 text-zinc-950">
              {item.title}
            </h2>

          <p className="mt-3 line-clamp-2 leading-6 text-zinc-600">
            {item.subtitle}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-zinc-500">
            <MapPin
              size={16}
              className="text-orange-600"
            />

            <span>
              {item.address}
            </span>
          </div>

          {typeof item.priceEuro === "number" && (
            <div className="mt-4 text-sm font-bold text-zinc-950">
              {item.priceTitle || t.hero.startingFrom}{" "}
              <span className="text-orange-700">{item.priceEuro} {item.currency ?? "EUR"}</span>
            </div>
          )}
          {item.type === "VILLA" && typeof item.priceWithDriverEuro === "number" && (
            <p className="mt-1.5 self-start rounded-lg border border-orange-100 bg-orange-50 px-2 py-1 text-xs font-semibold leading-4 text-zinc-600">
              <span className="font-bold text-orange-700">{item.priceWithDriverEuro} {item.currency ?? "EUR"}</span>{item.priceWithDriverLabel ? ` · ${item.priceWithDriverLabel}` : ""}
            </p>
          )}

          <div className="mt-auto inline-flex items-center gap-2 pt-5 font-black text-orange-700">
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                <span>
                  Opening...
                </span>
              </>
            ) : (
              <>
                <span>
                  {
                    t.categories
                      .explore
                  }
                </span>

                <ArrowRight
                  size={17}
                />
              </>
            )}
          </div>
        </div>
      </button>
    </article>
  );
}
