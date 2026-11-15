import "server-only";
import { cache } from "react";
import type { CatalogApiResponse, ProductType } from "@/store/catalog.store";
import type { ProductDetails } from "@/store/product-details.store";
import type { HomeProductsResponse } from "@/store/home-products.store";
import type { HeroConfiguration } from "@/types/hero";

export function apiBaseUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}
type PublicResult<T> = { status: "ok"; data: T } | { status: "missing" | "unavailable" };
// Request-local deduplication shares the same public response between metadata and
// visible content. Never seed a module-level browser store during server rendering.
const publicResponse = cache(async (path: string): Promise<PublicResult<unknown>> => {
  try {
    const response = await fetch(new URL(path, apiBaseUrl()), { cache: "no-store", signal: AbortSignal.timeout(10000), headers: { Accept: "application/json" } });
    if (response.status === 404) return { status: "missing" };
    if (!response.ok) return { status: "unavailable" };
    return { status: "ok", data: await response.json() };
  } catch { return { status: "unavailable" }; }
});
async function read<T>(path: string) { return await publicResponse(path) as PublicResult<T>; }
export const getHomeProducts = (locale: string) => read<HomeProductsResponse>(`/api/products/home?lang=${locale.toUpperCase()}`);
export const getHeroConfiguration = (locale: string) => read<HeroConfiguration>(`/api/website-configuration/hero?lang=${locale.toLowerCase()}`);
export const getCatalogProducts = (type: ProductType, locale: string, page: number) => read<CatalogApiResponse>(`/api/products/${type}?page=${page}&lang=${locale.toUpperCase()}`);
export const getProductContent = (type: string, slug: string, locale: string) => read<ProductDetails>(`/api/products/details/${encodeURIComponent(slug)}?lang=${locale.toUpperCase()}&type=${type}`);
