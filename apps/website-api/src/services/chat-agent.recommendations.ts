import type { CatalogProduct } from "./chat-agent.policy";

const paths: Record<string, string> = { VILLA: "villas", TRANSPORTATION: "transportation", SWIMMINGPOOL: "beachclubs", NIGHTCLUB: "nightclubs", ACTIVITY: "experiences", RESTAURANT: "restaurants" };
export type ProductRecommendation = {
  id: string; type: string; uniqueCode: string; title: string; subtitle: string;
  url: string; images: string[]; address: string; priceEuro: number | null;
  priceTitle: string; planTitle: string | null; pricingUnit: string | null; driverLabel: string | null;
};
function validImage(value: unknown): value is string {
  return typeof value === "string" && (/^https:\/\//i.test(value) || /^\/(?!\/)/.test(value));
}
export function productRecommendation(product: CatalogProduct, sourceId: string | null, language: string): ProductRecommendation {
  if (!paths[product.type]) throw new Error("Unsupported recommendation category");
  const withDriver = sourceId === `${product.id}:driver`;
  const selectedPlan = (product.plans || []).find((p: any) => p.id === sourceId);
  if (sourceId && sourceId !== product.id && !withDriver && !selectedPlan) throw new Error("The recommended price source does not belong to this product");
  if (withDriver && product.priceWithDriverEuro == null) throw new Error("This product has no published driver-inclusive price");
  const defaultPlan = !withDriver && !selectedPlan && !["VILLA", "RESTAURANT"].includes(product.type) ? product.plans?.[0] : null;
  const plan = selectedPlan || defaultPlan;
  const amount = withDriver ? product.priceWithDriverEuro : plan ? plan.salePrice : product.priceEuro;
  const images = [...new Set([product.thumbnail, ...(product.images || [])].filter(validImage))].slice(0, 8);
  const locale = ["fr", "de", "it", "es", "pt"].includes(language) ? `/${language}` : "";
  return {
    id: product.id, type: product.type, uniqueCode: product.uniqueCode, title: product.title,
    subtitle: product.subtitle || "", address: product.address || "",
    url: `${locale}/${paths[product.type]}/${encodeURIComponent(product.uniqueCode)}`,
    images, priceEuro: amount == null ? null : Number(amount), priceTitle: product.priceTitle || "",
    planTitle: plan?.title || null, pricingUnit: plan?.pricingUnit || null,
    driverLabel: withDriver ? product.priceWithDriverLabel || "" : null,
  };
}
