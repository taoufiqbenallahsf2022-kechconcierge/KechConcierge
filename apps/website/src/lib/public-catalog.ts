// Frontend availability only. Administration and stored products remain intact.
export const publicCategories = [
  { category: "villas", type: "VILLA", homeKey: "villa" },
  { category: "beachclubs", type: "SWIMMINGPOOL", homeKey: "swimmingpool" },
  { category: "restaurants", type: "RESTAURANT", homeKey: "restaurant" },
  { category: "experiences", type: "ACTIVITY", homeKey: "activity" },
  { category: "transportation", type: "TRANSPORTATION", homeKey: "transportation" },
  { category: "nightclubs", type: "NIGHTCLUB", homeKey: "nightclub" },
] as const;
export function isPublicProductType(type: string | null | undefined) {
  return publicCategories.some(category => category.type === type);
}
export function featuredThumbnail(items?: Array<{ thumbnail?: string | null }>) {
  return items?.find(item => typeof item.thumbnail === "string" && item.thumbnail.trim())?.thumbnail?.trim() || null;
}
