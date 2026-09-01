import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

import CategoryCatalog from "@/components/CategoryCatalog";
import {
  ProductType,
} from "@/store/catalog.store";
import { getCanonicalCategory, getCategoryContent, getCategoryType, isSupportedLocale } from "@/lib/catalog-api";
import { getLocaleFromPath, locales } from "@/lib/i18n";

type CategorySlug =
  | "villas"
  | "transportation"
  | "beachclubs"
  | "nightclubs"
  | "packs"
  | "experiences"
  | "restaurants"
  | "spa";

type Props = {
  params: Promise<{
    category: string;
  }>;
};

function localizedUrl(siteUrl: string, locale: string, category: string) {
  return new URL(`${locale === "en" ? "" : `/${locale}`}/${category}`, siteUrl).toString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const type = getCategoryType(category);
  if (!type) return { robots: { index: false, follow: false } };
  const requestHeaders = await headers();
  const locale = getLocaleFromPath(requestHeaders.get("x-moorish-public-pathname") || `/${category}`);
  if (!isSupportedLocale(locale)) return {};
  const canonicalCategory = getCanonicalCategory(type);
  const content = getCategoryContent(locale, type);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com";
  const canonical = localizedUrl(siteUrl, locale, canonicalCategory);
  const title = `${content.label} | Moorish Concierge`;
  const socialImage = "https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public";
  const languages = Object.fromEntries(locales.map((language) => [language, localizedUrl(siteUrl, language, canonicalCategory)]));
  return {
    title,
    description: content.description,
    alternates: { canonical, languages },
    openGraph: { type: "website", siteName: "Moorish Concierge", title, description: content.description, url: canonical, images: [{ url: socialImage, alt: content.label }] },
    twitter: { card: "summary_large_image", title, description: content.description, images: [socialImage] },
    robots: { index: true, follow: true },
  };
}

function getCategoryConfiguration(
  category: string
): {
  category: CategorySlug;
  productType: ProductType;
} | null {
  switch (category.toLowerCase()) {
    case "villa":
    case "villas":
      return {
        category: "villas",
        productType: "VILLA",
      };

    case "transportation":
    case "transportations":
      return {
        category: "transportation",
        productType: "TRANSPORTATION",
      };

    case "swimmingpool":
    case "swimmingpools":
    case "beachclub":
    case "beachclubs":
      return {
        category: "beachclubs",
        productType: "SWIMMINGPOOL",
      };

    case "nightclub":
    case "nightclubs":
      return { category: "nightclubs", productType: "NIGHTCLUB" };

    case "pack":
    case "packs":
      return { category: "packs", productType: "PACK" };

    case "activity":
    case "activities":
    case "experience":
    case "experiences":
      return {
        category: "experiences",
        productType: "ACTIVITY",
      };

    case "restaurant":
    case "restaurants":
      return {
        category: "restaurants",
        productType: "RESTAURANT",
      };

    case "spa":
      return {
        category: "spa",
        productType: "SPA",
      };

    default:
      return null;
  }
}

export default async function CategoryPage({
  params,
}: Props) {
  const { category } = await params;

  const configuration =
    getCategoryConfiguration(category);

  if (!configuration) {
    notFound();
  }

  const requestHeaders = await headers();
  const locale = getLocaleFromPath(requestHeaders.get("x-moorish-public-pathname") || `/${category}`);
  const type = getCategoryType(category)!;
  const canonicalCategory = getCanonicalCategory(type);
  const content = getCategoryContent(locale, type);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com";
  const url = localizedUrl(siteUrl, locale, canonicalCategory);
  const schemas = [{
    "@context": "https://schema.org", "@type": "CollectionPage", name: content.label,
    description: content.description, url, isPartOf: { "@type": "WebSite", name: "Moorish Concierge", url: siteUrl },
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Moorish Concierge", item: siteUrl },
      { "@type": "ListItem", position: 2, name: content.label, item: url },
    ],
  }];

  return (
    <>
      {schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />)}
      <CategoryCatalog category={configuration.category} productType={configuration.productType} />
    </>
  );
}
