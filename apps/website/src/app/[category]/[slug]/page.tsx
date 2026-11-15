import { isPublicProductType } from "@/lib/public-catalog";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ProductDetailsPage from "@/components/ProductDetailsPage";
import { getLocaleFromPath } from "@/lib/i18n";
import { getCategoryType } from "@/lib/catalog-api";
import { getProductContent } from "@/lib/public-content.server";

export default async function ProductPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const type = getCategoryType(category);
  if (!type || !isPublicProductType(type)) notFound();
  const requestHeaders = await headers();
  const locale = getLocaleFromPath(requestHeaders.get("x-moorish-public-pathname") || `/${category}/${slug}`);
  const result = await getProductContent(type, slug, locale);
  if (result.status === "missing") notFound();
  const initialProduct = result.status === "ok" && result.data.type === type ? result.data : undefined;
  return <ProductDetailsPage key={`${locale}:${category}:${slug}`} categoryParameter={category} uniqueCode={slug} initialLocale={locale} initialProduct={initialProduct} />;
}
