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

export function apiBaseUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

export async function getSeoProduct(category: string, slug: string, locale: string) {
  const type = productTypeByCategory[category as keyof typeof productTypeByCategory];
  if (!type) return null;
  try {
    const response = await fetch(`${apiBaseUrl()}/api/products/details/${encodeURIComponent(slug)}?lang=${locale}&type=${type}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    return (await response.json()) as SeoProduct;
  } catch { return null; }
}

export function seoDescription(product: SeoProduct) {
  const source = product.description || product.subtitle || `${product.title} in ${product.address || "Marrakech"}.`;
  const clean = source.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  const shortened = clean.slice(0, 157);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 120 ? lastSpace : 157)}…`;
}
