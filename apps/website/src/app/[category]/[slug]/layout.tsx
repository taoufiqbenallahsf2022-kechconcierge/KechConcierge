import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocaleFromPath, locales } from "@/lib/i18n";
import { getSeoProduct, seoDescription } from "@/lib/product-seo";

type Props = { children: React.ReactNode; params: Promise<{ category: string; slug: string }> };

function localizedUrl(siteUrl: string, locale: string, category: string, slug: string) {
  return new URL(`${locale === "en" ? "" : `/${locale}`}/${category}/${slug}`, siteUrl).toString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const requestHeaders = await headers();
  const publicPath = requestHeaders.get("x-moorish-public-pathname") || `/${category}/${slug}`;
  const locale = getLocaleFromPath(publicPath);
  const product = await getSeoProduct(category, slug, locale);
  if (!product) return { robots: { index: false, follow: false } };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com";
  const canonical = localizedUrl(siteUrl, locale, category, slug);
  const title = `${product.title} | Moorish Concierge`;
  const description = seoDescription(product);
  const languages = Object.fromEntries(locales.map((language) => [language, localizedUrl(siteUrl, language, category, slug)]));
  const images = product.thumbnail ? [{ url: product.thumbnail, alt: product.thumbnailAlt || product.title }] : undefined;
  return {
    title, description, alternates: { canonical, languages }, robots: { index: true, follow: true },
    openGraph: { type: "website", siteName: "Moorish Concierge", title, description, url: canonical, images },
    twitter: { card: "summary_large_image", title, description, images: product.thumbnail ? [product.thumbnail] : undefined },
  };
}

export default async function ProductSeoLayout({ children, params }: Props) {
  const { category, slug } = await params;
  const requestHeaders = await headers();
  const publicPath = requestHeaders.get("x-moorish-public-pathname") || `/${category}/${slug}`;
  const locale = getLocaleFromPath(publicPath);
  const product = await getSeoProduct(category, slug, locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com";
  const url = localizedUrl(siteUrl, locale, category, slug);
  const schemas = product ? [{
    "@context": "https://schema.org", "@type": "Service", name: product.title, description: seoDescription(product),
    image: product.thumbnail || undefined, url, areaServed: { "@type": "City", name: product.address || "Marrakech" },
    provider: { "@type": "LocalBusiness", name: "Moorish Concierge", url: siteUrl },
    ...(product.priceEuro != null ? { offers: { "@type": "Offer", price: product.priceEuro, priceCurrency: "EUR", url } } : {}),
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Moorish Concierge", item: siteUrl },
      { "@type": "ListItem", position: 2, name: category, item: new URL(`/${category}`, siteUrl).toString() },
      { "@type": "ListItem", position: 3, name: product.title, item: url },
    ],
  }] : [];
  return <>{schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />)}{children}</>;
}
