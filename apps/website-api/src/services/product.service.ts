import { prisma } from "../config/prisma";

const languages = ["FR", "EN", "DE", "IT", "PT", "ES"] as const;
type Language = (typeof languages)[number];
type PublicType = "VILLA" | "SWIMMINGPOOL" | "NIGHTCLUB" | "PACK" | "ACTIVITY" | "SPA" | "TRANSPORTATION" | "RESTAURANT";
type IndependentType = Exclude<PublicType, "SPA">;

const delegateByType: Record<IndependentType, "villa" | "beachClub" | "nightClub" | "pack" | "activity" | "transportation" | "restaurant"> = {
  VILLA: "villa", SWIMMINGPOOL: "beachClub", NIGHTCLUB: "nightClub", PACK: "pack", ACTIVITY: "activity", TRANSPORTATION: "transportation", RESTAURANT: "restaurant",
};
const planTypes = new Set<PublicType>(["SWIMMINGPOOL", "NIGHTCLUB", "PACK", "ACTIVITY", "TRANSPORTATION"]);
const startingFrom: Record<Language, string> = { EN: "Starting from", FR: "À partir de", DE: "Ab", IT: "A partire da", PT: "A partir de", ES: "Desde" };

function normalizeLang(lang?: string): Language {
  const language = lang?.toUpperCase() as Language;
  return languages.includes(language) ? language : "EN";
}
function normalizeType(type?: string): PublicType | null {
  const normalized = type?.toUpperCase() as PublicType;
  return [...Object.keys(delegateByType), "SPA"].includes(normalized) ? normalized : null;
}
function localized(row: any, prefix: string, language: Language) {
  return row?.[`${prefix}${language}`] ?? row?.[`${prefix}EN`] ?? "";
}
function publicPlan(row: any, language: Language) {
  return {
    id: row.id, uniqueCode: row.uniqueCode, salePrice: Number(row.salePrice), currency: "€",
    pricingUnit: row.pricingUnit, title: localized(row, "title", language), description: localized(row, "description", language),
    serviceType: row.serviceType ?? null, origin: row.origin ?? null, destination: row.destination ?? null,
    durationMinutes: row.durationMinutes ?? null,
    options: (row.options ?? []).map((item: any) => ({ id: item.id, title: localized(item, "title", language), order: item.order })),
  };
}
function mapIndependent(row: any, type: IndependentType, language: Language, full = false) {
  const plans = (row.plans ?? []).map((item: any) => publicPlan(item, language));
  const cheapest = plans[0];
  const price = type === "VILLA" || type === "RESTAURANT" ? (row.priceEuro == null ? null : Number(row.priceEuro)) : cheapest?.salePrice ?? null;
  const currency = price == null ? null : "€";
  const relationImages = row.images ?? [];
  const storedAlts = row.imageAlts && typeof row.imageAlts === "object" ? row.imageAlts : {};
  const localizedAlts = Object.fromEntries([
    ["thumbnail", storedAlts.thumbnail?.[language.toLowerCase()] ?? storedAlts.thumbnail?.en ?? localized(row, "title", language)],
    ...relationImages.map((image: any, index: number) => [`image${index + 1}`, localized(image, "alt", language) || localized(row, "title", language)]),
  ]);
  const base = {
    id: row.id, type, uniqueCode: row.uniqueCode, order: row.order, thumbnail: row.thumbnail, thumbnailAlt: localizedAlts.thumbnail,
    priceEuro: price, currency, title: localized(row, "title", language), subtitle: localized(row, "subtitle", language),
    priceTitle: price == null ? "" : localized(row, "priceTitle", language) || startingFrom[language],
    address: localized(row, "location", language) || localized(row, "address", language),
  };
  if (!full) return base;
  return {
    ...base, description: localized(row, "description", language), tags: row[`tags${language}`] ?? row.tagsEN ?? [], details: row[`details${language}`] ?? row.detailsEN ?? [],
    ...Object.fromEntries(Array.from({ length: 50 }, (_, index) => [`image${index + 1}`, relationImages[index]?.url ?? null])),
    imageAlts: localizedAlts, plans,
  };
}
function mapLegacySpa(row: any, language: Language, full = false) {
  const imageAlts = Object.fromEntries(Object.entries(row.imageAlts ?? {}).map(([key, translations]: [string, any]) => [key, translations?.[language.toLowerCase()] || translations?.en || ""]));
  const base = { id: row.id, type: row.type, uniqueCode: row.uniqueCode, order: row.order, thumbnail: row.thumbnail, thumbnailAlt: imageAlts.thumbnail || localized(row, "title", language), priceEuro: row.priceEuro == null ? null : Number(row.priceEuro), currency: "€", title: localized(row, "title", language), subtitle: localized(row, "subtitle", language), priceTitle: localized(row, "priceTitle", language), address: localized(row, "address", language) };
  if (!full) return base;
  return { ...base, description: localized(row, "description", language), tags: row[`tags${language}`] ?? [], details: row[`details${language}`] ?? [], ...Object.fromEntries(Array.from({ length: 50 }, (_, index) => [`image${index + 1}`, row[`image${index + 1}`] ?? null])), imageAlts, plans: [] };
}
function independentInclude(type: IndependentType, full = false) {
  return {
    ...(full ? { images: { orderBy: { order: "asc" } } } : {}),
    ...(planTypes.has(type) ? { plans: { where: { isActive: true }, orderBy: [{ salePrice: "asc" }, { order: "asc" }], ...(full ? { include: { options: { where: { isActive: true }, orderBy: { order: "asc" } } } } : {}) } } : {}),
  };
}

export async function getHomeProducts(lang?: string) {
  const language = normalizeLang(lang);
  const where = { isActive: true, order: { gte: 1, lte: 10 } };
  const types: IndependentType[] = ["VILLA", "TRANSPORTATION", "SWIMMINGPOOL", "NIGHTCLUB", "ACTIVITY", "PACK", "RESTAURANT"];
  const rows = await Promise.all(types.map((type) => (prisma as any)[delegateByType[type]].findMany({ where, include: independentInclude(type), orderBy: { order: "asc" } })));
  const spa = await prisma.product.findMany({ where: { type: "SPA", ...where }, orderBy: { order: "asc" } });
  const result: Record<string, any[]> = {};
  types.forEach((type, index) => { result[type.toLowerCase()] = rows[index].map((row: any) => mapIndependent(row, type, language)); });
  result.spa = spa.map((row) => mapLegacySpa(row, language));
  return result;
}

export async function getProductsByType(type: string, page: number, lang?: string) {
  const language = normalizeLang(lang);
  const normalizedType = normalizeType(type);
  if (!normalizedType) throw Object.assign(new Error("Unsupported product type"), { status: 400 });
  const safePage = Math.max(1, Number(page) || 1), take = 12, skip = (safePage - 1) * take;
  if (normalizedType === "SPA") {
    const [rows, total] = await Promise.all([prisma.product.findMany({ where: { type: "SPA", isActive: true }, orderBy: [{ order: "asc" }, { createdAt: "desc" }], skip, take }), prisma.product.count({ where: { type: "SPA", isActive: true } })]);
    return { page: safePage, perPage: take, total, totalPages: Math.ceil(total / take), items: rows.map((row) => mapLegacySpa(row, language)) };
  }
  const delegate = (prisma as any)[delegateByType[normalizedType]];
  const [rows, total] = await Promise.all([delegate.findMany({ where: { isActive: true }, include: independentInclude(normalizedType), orderBy: [{ order: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }], skip, take }), delegate.count({ where: { isActive: true } })]);
  return { page: safePage, perPage: take, total, totalPages: Math.ceil(total / take), items: rows.map((row: any) => mapIndependent(row, normalizedType, language)) };
}

export async function getProductDetails(uniqueCode: string, lang?: string, requestedType?: string) {
  const language = normalizeLang(lang);
  const normalizedType = normalizeType(requestedType);
  if (normalizedType === "SPA") {
    const row = await prisma.product.findFirst({ where: { uniqueCode, type: "SPA", isActive: true } });
    return row ? mapLegacySpa(row, language, true) : null;
  }
  const types: IndependentType[] = normalizedType ? [normalizedType as IndependentType] : ["VILLA", "TRANSPORTATION", "SWIMMINGPOOL", "NIGHTCLUB", "ACTIVITY", "PACK", "RESTAURANT"];
  for (const type of types) {
    const row = await (prisma as any)[delegateByType[type]].findFirst({ where: { uniqueCode, isActive: true }, include: independentInclude(type, true) });
    if (row) return mapIndependent(row, type, language, true);
  }
  const spa = await prisma.product.findFirst({ where: { uniqueCode, type: "SPA", isActive: true } });
  return spa ? mapLegacySpa(spa, language, true) : null;
}
