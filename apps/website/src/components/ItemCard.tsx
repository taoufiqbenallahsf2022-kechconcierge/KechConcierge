"use client";

import Image from "next/image";
import { MapPin, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ItemCardProps = {
  item: {
    id: string;
    type?: string;
    category?: string;
    uniqueCode?: string;
    slug?: string;
    thumbnail?: string;
    images?: string[];
    title: string;
    subtitle?: string;
    address?: string;
    priceEuro?: number;
    priceTitle?: string;
  };
  locale: string;
};

const typeToCategory: Record<string, string> = {
  VILLA: "villas",
  APARTMENT: "apartments",
  ACTIVITY: "activities",
  TRANSPORTATION: "transportation",
  SPA: "spa",
  RESTAURANT: "restaurants",
};

export default function ItemCard({
  item,
  locale,
}: ItemCardProps) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const category =
    item.category ||
    (item.type
      ? typeToCategory[item.type]
      : "products");

  const slug =
    item.slug ||
    item.uniqueCode ||
    item.id;

  const imageUrl =
    item.thumbnail ||
    item.images?.[0] ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";

  function localizePath(
    path: string
  ) {
    if (locale === "en") {
      return path;
    }

    return `/${locale}${path}`;
  }

  const productPath =
    localizePath(
      `/${category}/${slug}`
    );

  function openProduct() {
    if (loading) {
      return;
    }

    setLoading(true);

    router.push(productPath);
  }

  function prefetchProduct() {
    if (!loading) {
      router.prefetch(
        productPath
      );
    }
  }

  return (
    <button
      type="button"
      onClick={openProduct}
      onMouseEnter={
        prefetchProduct
      }
      onFocus={prefetchProduct}
      disabled={loading}
      aria-busy={loading}
      className="group relative block min-w-[300px] max-w-[300px] overflow-hidden rounded-3xl bg-white text-left card-shadow transition disabled:cursor-wait"
    >
      <div className="relative h-56 overflow-hidden">
        <Image
          src={`${imageUrl}?auto=format&fit=crop&w=900&q=80`}
          alt={item.title}
          fill
          className={`object-cover transition duration-500 ${
            loading
              ? "scale-105 opacity-70"
              : "group-hover:scale-105"
          }`}
        />

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-orange-700">
          {category}
        </div>

        {loading && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-zinc-950/45 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2
                size={30}
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
        className={`p-5 transition ${
          loading
            ? "opacity-70"
            : ""
        }`}
      >
        <h3 className="text-lg font-black text-zinc-950">
          {item.title}
        </h3>

        {item.subtitle && (
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
            {item.subtitle}
          </p>
        )}

        {item.address && (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
            <MapPin
              size={16}
              className="text-orange-700"
            />

            <span>
              {item.address}
            </span>
          </div>
        )}

        {typeof item.priceEuro ===
          "number" && (
          <div className="mt-4 text-sm font-bold text-zinc-950">
            {item.priceTitle ||
              "From"}{" "}
            <span className="text-orange-700">
              {item.priceEuro}€
            </span>
          </div>
        )}
      </div>
    </button>
  );
}