"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import {
  TouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getDictionary,
  getLocaleFromPath,
} from "@/lib/i18n";

import {
  ProductDetails,
  ProductDisplayDetail,
  ProductType,
  useProductDetailsStore,
} from "@/store/product-details.store";

type CategorySlug =
  | "villas"
  | "transportation"
  | "swimmingpools"
  | "activities"
  | "restaurants"
  | "spa";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";


function getProductType(
  category: string
): ProductType | null {
  switch (category.toLowerCase()) {
    case "villa":
    case "villas":
      return "VILLA";

    case "transportation":
    case "transportations":
      return "TRANSPORTATION";

    case "swimmingpool":
    case "swimmingpools":
      return "SWIMMINGPOOL";

    case "activity":
    case "activities":
      return "ACTIVITY";

    case "restaurant":
    case "restaurants":
      return "RESTAURANT";

    case "spa":
      return "SPA";

    default:
      return null;
  }
}

function getCanonicalCategory(
  productType: ProductType
): CategorySlug {
  switch (productType) {
    case "VILLA":
      return "villas";

    case "TRANSPORTATION":
      return "transportation";

    case "SWIMMINGPOOL":
      return "swimmingpools";

    case "ACTIVITY":
      return "activities";

    case "RESTAURANT":
      return "restaurants";

    case "SPA":
      return "spa";
  }
}

function getLocalizedPath(
  locale: string,
  path: string
) {
  return locale === "en"
    ? path
    : `/${locale}${path}`;
}

function getCategoryLabel(
  dictionary: ReturnType<typeof getDictionary>,
  category: CategorySlug
) {
  switch (category) {
    case "villas":
      return dictionary.categories.villasLabel;

    case "transportation":
      return dictionary.categories.transportationLabel;

    case "swimmingpools":
      return dictionary.categories.swimmingPoolsLabel;

    case "activities":
      return dictionary.categories.activitiesLabel;

    case "restaurants":
      return dictionary.categories.restaurantsLabel;

    case "spa":
      return dictionary.categories.spaLabel;
  }
}

function isDisplayDetail(
  detail: unknown
): detail is ProductDisplayDetail {
  if (
    typeof detail !== "object" ||
    detail === null
  ) {
    return false;
  }

  const candidate = detail as {
    label?: unknown;
    value?: unknown;
  };

  return (
    typeof candidate.label === "string" &&
    candidate.label.trim().length > 0 &&
    typeof candidate.value === "string" &&
    candidate.value.trim().length > 0
  );
}

function extractImages(
  product: ProductDetails
): string[] {
  const images: string[] = [];

  for (let index = 1; index <= 20; index += 1) {
    const imageKey =
      `image${index}` as keyof ProductDetails;

    const image = product[imageKey];

    if (
      typeof image === "string" &&
      image.trim().length > 0
    ) {
      images.push(image);
    }
  }

  if (
    images.length === 0 &&
    product.thumbnail
  ) {
    images.push(product.thumbnail);
  }

  return images;
}

function WhatsAppIcon({
  size = 22,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.04 3C8.86 3 3.02 8.8 3.02 15.94c0 2.5.72 4.94 2.08 7.02L3 29l6.24-2.05a13.06 13.06 0 0 0 6.79 1.9h.01c7.17 0 13.01-5.81 13.01-12.95C29.05 8.8 23.21 3 16.04 3Zm0 23.66h-.01a10.83 10.83 0 0 1-5.52-1.51l-.4-.24-3.7 1.22 1.24-3.59-.26-.41a10.68 10.68 0 0 1-1.66-5.73c0-5.9 4.83-10.7 10.77-10.7 5.94 0 10.77 4.8 10.77 10.7 0 5.9-4.83 10.7-10.77 10.7Zm5.91-8.03c-.32-.16-1.91-.94-2.21-1.05-.3-.11-.52-.16-.74.16-.22.32-.85 1.05-1.04 1.27-.19.21-.38.24-.7.08-.32-.16-1.37-.5-2.61-1.59-.97-.86-1.62-1.92-1.81-2.24-.19-.32-.02-.5.14-.65.15-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.4-.3.32-1.14 1.11-1.14 2.71 0 1.59 1.17 3.13 1.33 3.34.16.21 2.3 3.5 5.57 4.91.78.34 1.39.54 1.87.69.79.25 1.5.21 2.07.13.63-.09 1.91-.78 2.18-1.53.27-.75.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37Z" />
    </svg>
  );
}

function ProductDetailsSkeleton() {
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="h-5 w-40 animate-pulse rounded-full bg-zinc-200" />

      <div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="min-w-0">
          <div className="h-[520px] w-full animate-pulse rounded-[2rem] bg-zinc-200" />

          <div className="mt-4 flex w-full gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-24 w-32 shrink-0 animate-pulse rounded-2xl bg-zinc-200"
                />
              )
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-200" />
          <div className="mt-4 h-12 w-3/4 animate-pulse rounded-full bg-zinc-200" />
          <div className="mt-4 h-5 w-40 animate-pulse rounded-full bg-zinc-200" />
          <div className="mt-5 h-8 w-32 animate-pulse rounded-full bg-zinc-200" />

          <div className="mt-8 space-y-3">
            <div className="h-4 w-full animate-pulse rounded-full bg-zinc-200" />
            <div className="h-4 w-full animate-pulse rounded-full bg-zinc-200" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-zinc-200" />
          </div>

          <div className="mt-8 flex gap-3">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-9 w-28 animate-pulse rounded-full bg-zinc-200"
                />
              )
            )}
          </div>

          <div className="mt-8 h-52 animate-pulse rounded-3xl bg-zinc-200" />
        </div>
      </div>
    </section>
  );
}

export default function DetailsPage() {
  const params = useParams<{
    category: string;
    slug: string;
  }>();

  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);
  const categoryParameter = params.category;
  const uniqueCode = params.slug;

  const productType =
    getProductType(categoryParameter);

  const {
    product,
    loading,
    hasLoaded,
    error,
    startLoading,
    setProduct,
    setError,
  } = useProductDetailsStore();

  const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  "212613859834";

  const [selectedImage, setSelectedImage] =
    useState(0);

  const touchStartX = useRef<number | null>(
    null
  );

  const touchEndX = useRef<number | null>(
    null
  );

  useEffect(() => {
    if (!productType || !uniqueCode) {
      return;
    }

    const controller = new AbortController();

    async function loadProduct() {
      startLoading(
        uniqueCode,
        locale.toUpperCase()
      );

      setSelectedImage(0);

      try {
        const url = new URL(
          `/api/products/details/${uniqueCode}`,
          API_URL
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

        const data =
          (await response.json()) as
            | ProductDetails
            | {
                code?: string;
                message?: string;
              };

        if (!response.ok) {
          const errorData = data as {
            code?: string;
            message?: string;
          };

          throw new Error(
            errorData.message ||
              errorData.code ||
              "Unable to load product details."
          );
        }

        const loadedProduct =
          data as ProductDetails;

        if (
          loadedProduct.type !== productType
        ) {
          throw new Error(
            "The product does not match this category."
          );
        }

        setProduct(
          loadedProduct,
          locale.toUpperCase()
        );
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Unable to load product details:",
          requestError
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load product details."
        );
      }
    }

    loadProduct();

    return () => {
      controller.abort();
    };
  }, [
    locale,
    productType,
    setError,
    setProduct,
    startLoading,
    uniqueCode,
  ]);

  const images = useMemo(() => {
    if (!product) {
      return [];
    }

    return extractImages(product);
  }, [product]);

  const visibleDetails = useMemo(() => {
    if (
      !product ||
      !Array.isArray(product.details)
    ) {
      return [];
    }

    return product.details.filter(
      isDisplayDetail
    );
  }, [product]);

  function showPreviousImage() {
    if (images.length <= 1) {
      return;
    }

    setSelectedImage((current) =>
      current === 0
        ? images.length - 1
        : current - 1
    );
  }

  function showNextImage() {
    if (images.length <= 1) {
      return;
    }

    setSelectedImage((current) =>
      current === images.length - 1
        ? 0
        : current + 1
    );
  }

  function handleTouchStart(
    event: TouchEvent<HTMLDivElement>
  ) {
    touchStartX.current =
      event.targetTouches[0].clientX;

    touchEndX.current = null;
  }

  function handleTouchMove(
    event: TouchEvent<HTMLDivElement>
  ) {
    touchEndX.current =
      event.targetTouches[0].clientX;
  }

  function handleTouchEnd() {
    if (
      touchStartX.current === null ||
      touchEndX.current === null
    ) {
      return;
    }

    const distance =
      touchStartX.current -
      touchEndX.current;

    const minimumSwipeDistance = 50;

    if (distance > minimumSwipeDistance) {
      showNextImage();
    }

    if (distance < -minimumSwipeDistance) {
      showPreviousImage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  if (!productType) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-3xl bg-red-50 p-8 text-center font-bold text-red-700">
          {t.productDetails.invalidCategory}
        </div>
      </section>
    );
  }

  if (!hasLoaded || loading) {
    return <ProductDetailsSkeleton />;
  }

  if (error || !product) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-3xl bg-red-50 p-8 text-center text-red-700">
          <p className="text-xl font-black">
            Unable to load this product.
          </p>

          {error && (
            <p className="mt-3 text-sm font-semibold">
              {error}
            </p>
          )}
        </div>
      </section>
    );
  }

  const canonicalCategory =
    getCanonicalCategory(product.type);

  const categoryLabel = getCategoryLabel(
    t,
    canonicalCategory
  );

  const categoryPath = getLocalizedPath(
    locale,
    `/${canonicalCategory}`
  );

  const contactPath = getLocalizedPath(
    locale,
    "/contact"
  );

  const chatPath = getLocalizedPath(
    locale,
    "/chat"
  );

  const activeImage =
    images[selectedImage] ||
    product.thumbnail;

  const FRONTEND_URL =
  process.env.NEXT_PUBLIC_API_URL;

  const productUrl =
  `${FRONTEND_URL}${pathname}`;
  
  const whatsappMessage = encodeURIComponent(
    `Hello,

    I am interested in ${product.title}.

    ${productUrl}`
    );

  const whatsappUrl =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  return (
    <section className="mx-auto max-w-7xl overflow-x-hidden px-4 py-20">
      <Link
        href={categoryPath}
        className="font-black text-orange-700 transition hover:text-orange-800"
      >
        ← {t.productDetails.backTo} {categoryLabel}
      </Link>

      <div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="min-w-0 overflow-hidden">
          <div
            className="relative h-[520px] w-full max-w-full touch-pan-y overflow-hidden rounded-[2rem] card-shadow"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              key={`${selectedImage}-${activeImage}`}
              src={activeImage}
              alt={`${product.title} image ${
                selectedImage + 1
              }`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  aria-label="{t.productDetails.previousImage}"
                  className="absolute left-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-zinc-950 shadow-lg backdrop-blur transition hover:bg-white"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  type="button"
                  onClick={showNextImage}
                  aria-label="{t.productDetails.nextImage}"
                  className="absolute right-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-zinc-950 shadow-lg backdrop-blur transition hover:bg-white"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="absolute bottom-4 right-4 rounded-full bg-zinc-950/75 px-4 py-2 text-sm font-black text-white backdrop-blur">
                  {selectedImage + 1} /{" "}
                  {images.length}
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="no-scrollbar mt-4 flex w-full max-w-full gap-3 overflow-x-auto overscroll-x-contain pb-2">
              {images.map(
                (image, index) => (
                  <button
                    key={`${index}-${image}`}
                    type="button"
                    onClick={() =>
                      setSelectedImage(index)
                    }
                    aria-label={`Display image ${
                      index + 1
                    }`}
                    className={`relative h-24 w-32 min-w-32 shrink-0 overflow-hidden rounded-2xl border-4 transition ${
                      selectedImage === index
                        ? "border-orange-600"
                        : "border-transparent hover:border-orange-200"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} image ${
                        index + 1
                      }`}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
            {categoryLabel}
          </p>

          <h1 className="mt-3 break-words text-5xl font-black text-zinc-950">
            {product.title}
          </h1>

          <p className="mt-3 break-words text-lg font-bold text-zinc-500">
            {product.address}
          </p>

          <p className="mt-5 text-sm font-bold text-zinc-500">
            {product.priceTitle}
          </p>

          <p className="text-3xl font-black text-orange-700">
            €{product.priceEuro}
          </p>

          {product.subtitle && (
            <p className="mt-5 break-words text-lg font-bold leading-8 text-zinc-600">
              {product.subtitle}
            </p>
          )}

          <p className="mt-6 break-words text-lg leading-8 text-zinc-700">
            {product.description}
          </p>

          {product.tags.length > 0 && (
            <div className="mt-8">
              <p className="text-xl font-black text-zinc-950">
                {t.productDetails.highlights}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="max-w-full break-words rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {visibleDetails.length > 0 && (
            <div className="mt-8 rounded-3xl bg-white p-6 card-shadow">
              <p className="text-xl font-black text-zinc-950">
                {t.productDetails.details}
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {visibleDetails.map(
                  (detail, index) => (
                    <div
                      key={`${detail.label}-${index}`}
                      className="min-w-0"
                    >
                      <p className="break-words text-sm font-bold text-zinc-500">
                        {detail.label}
                      </p>

                      <p className="mt-1 break-words font-black text-zinc-950">
                        {detail.value}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={contactPath}
              className="rounded-full bg-orange-600 px-7 py-4 text-center font-black text-white transition hover:bg-orange-700"
            >
              {t.productDetails.contactUs}
            </Link>

            <Link
              href={chatPath}
              className="rounded-full bg-zinc-950 px-7 py-4 text-center font-black text-white transition hover:bg-orange-700"
            >
              {t.productDetails.openChat}
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#1ebe5d] hover:shadow-md"
            >
              <WhatsAppIcon size={18} />

              {t.productDetails.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}