"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useMemo } from "react";

import CategoryItemCard from "@/components/CategoryItemCard";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

import {
  ProductType,
  useCatalogStore,
} from "@/store/catalog.store";

type CategorySlug =
  | "villas"
  | "transportation"
  | "swimmingpools"
  | "activities"
  | "restaurants"
  | "spa";

type CategoryCatalogProps = {
  category: CategorySlug;
  productType: ProductType;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

function getLocalizedCategoryPath(
  locale: string,
  category: CategorySlug
) {
  return locale === "en"
    ? `/${category}`
    : `/${locale}/${category}`;
}

function getCategoryText(
  dictionary: ReturnType<typeof getDictionary>,
  category: CategorySlug
) {
  switch (category) {
    case "villas":
      return {
        label: dictionary.categories.villasLabel,
        description:
          dictionary.categories.villasDescription,
      };

    case "transportation":
      return {
        label:
          dictionary.categories.transportationLabel,
        description:
          dictionary.categories
            .transportationDescription,
      };

    case "swimmingpools":
      return {
        label:
          dictionary.categories.swimmingPoolsLabel,
        description:
          dictionary.categories
            .swimmingPoolsDescription,
      };

    case "activities":
      return {
        label:
          dictionary.categories.activitiesLabel,
        description:
          dictionary.categories
            .activitiesDescription,
      };

    case "restaurants":
      return {
        label:
          dictionary.categories.restaurantsLabel,
        description:
          dictionary.categories
            .restaurantsDescription,
      };

    case "spa":
      return {
        label: dictionary.categories.spaLabel,
        description:
          dictionary.categories.spaDescription,
      };
  }
}

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

export default function CategoryCatalog({
  category,
  productType,
}: CategoryCatalogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const locale = getLocaleFromPath(pathname);
  const dictionary = getDictionary(locale);

  const categoryContent = getCategoryText(
    dictionary,
    category
  );

  const currentPage = useMemo(() => {
    const value = Number(
      searchParams.get("page") || "1"
    );

    if (
      !Number.isInteger(value) ||
      value < 1
    ) {
      return 1;
    }

    return value;
  }, [searchParams]);

  const {
    items,
    page,
    total,
    totalPages,

    loading,
    hasLoaded,
    error,

    startLoading,
    setError,
    setCatalogData,
  } = useCatalogStore();

  const localizedCategoryPath =
    getLocalizedCategoryPath(
      locale,
      category
    );

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      startLoading(
        productType,
        locale.toUpperCase()
      );

      try {
        const url = new URL(
          `/api/products/${productType}`,
          API_URL
        );

        url.searchParams.set(
          "page",
          String(currentPage)
        );

        url.searchParams.set(
          "lang",
          locale.toUpperCase()
        );

        const response = await fetch(
          url.toString(),
          {
            method: "GET",

            headers: {
              Accept: "application/json",
            },

            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.code ||
              "Unable to load products."
          );
        }

        setCatalogData(
          data,
          productType,
          locale.toUpperCase()
        );

        if (
          data.totalPages > 0 &&
          currentPage > data.totalPages
        ) {
          router.replace(
            `${localizedCategoryPath}?page=${data.totalPages}`
          );
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Unable to fetch catalog products:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load products."
        );
      }
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    currentPage,
    locale,
    localizedCategoryPath,
    productType,
    router,
    setCatalogData,
    setError,
    startLoading,
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
        Catalog
      </p>

      <h1 className="mt-3 text-5xl font-black text-zinc-950">
        {categoryContent.label}
      </h1>

      <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700">
        {categoryContent.description}
      </p>

      {/*
       * Show the skeleton:
       * - before the first request starts;
       * - while the request is running.
       *
       * This prevents the empty message from flashing.
       */}
      {(!hasLoaded || loading) && (
        <div className="mt-10">
          <HorizontalSectionSkeleton />
        </div>
      )}

      {hasLoaded && !loading && error && (
        <div className="mt-10 rounded-3xl bg-red-50 p-6 text-center font-bold text-red-700">
          Unable to load the catalog.

          <p className="mt-2 text-sm font-medium">
            {error}
          </p>
        </div>
      )}

      {hasLoaded &&
        !loading &&
        !error &&
        items.length === 0 && (
          <div className="mt-10 rounded-3xl bg-white p-8 text-center text-zinc-600 shadow-sm">
            No products were found.
          </div>
        )}

      {hasLoaded &&
        !loading &&
        !error &&
        items.length > 0 && (
          <>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <CategoryItemCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>

            <p className="mt-8 text-center text-sm font-semibold text-zinc-500">
              {total} results
            </p>
          </>
        )}

      {hasLoaded &&
        !loading &&
        !error &&
        totalPages > 1 && (
          <nav
            aria-label="Catalog pagination"
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {Array.from({
              length: totalPages,
            }).map((_, index) => {
              const pageNumber = index + 1;
              const isCurrentPage =
                page === pageNumber;

              return (
                <Link
                  key={pageNumber}
                  href={`${localizedCategoryPath}?page=${pageNumber}`}
                  aria-current={
                    isCurrentPage
                      ? "page"
                      : undefined
                  }
                  className={`grid h-11 w-11 place-items-center rounded-full font-black transition ${
                    isCurrentPage
                      ? "bg-orange-600 text-white"
                      : "bg-white text-zinc-900 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  {pageNumber}
                </Link>
              );
            })}
          </nav>
        )}
    </section>
  );
}