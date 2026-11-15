import { isPublicProductType } from "./public-catalog";
import { apiBaseUrl, getProductContent } from "./public-content.server";
import { getCategoryType } from "./catalog-api";
export { apiBaseUrl };
export const productTypeByCategory = {
  villas: "VILLA", transportation: "TRANSPORTATION", beachclubs: "SWIMMINGPOOL", nightclubs: "NIGHTCLUB",
  packs: "PACK", experiences: "ACTIVITY", restaurants: "RESTAURANT", spa: "SPA",
} as const;

export const categoryByProductType: Record<string, keyof typeof productTypeByCategory> = Object.fromEntries(
  Object.entries(productTypeByCategory).map(([category, type]) => [type, category]),
) as Record<string, keyof typeof productTypeByCategory>;

export type SeoProduct = {
  uniqueCode: string; type: string; title: string; subtitle?: string | null; description?: string | null;
  address?: string | null; thumbnail?: string | null; thumbnailAlt?: string | null; priceEuro?: number | null; currency?: string | null;
};

export async function getSeoProduct(category: string, slug: string, locale: string) {
  const type = getCategoryType(category);
  if (!type || !isPublicProductType(type)) return null;
  const result = await getProductContent(type, slug, locale);
  return result.status === "ok" ? result.data : null;
}

export function seoDescription(product: SeoProduct) {
  const source = product.description || product.subtitle || `${product.title} in ${product.address || "Marrakech"}.`;
  const clean = source.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  const shortened = clean.slice(0, 157);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 120 ? lastSpace : 157)}…`;
}
