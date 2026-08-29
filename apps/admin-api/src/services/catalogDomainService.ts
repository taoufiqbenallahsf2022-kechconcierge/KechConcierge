import { prisma } from "../lib/prisma.js";

const languages = ["EN", "FR", "DE", "IT", "PT", "ES"] as const;
const textPrefixes = ["title", "subtitle", "description", "location", "priceTitle"] as const;

type DomainConfig = {
  delegate: "villa" | "restaurant" | "beachClub" | "nightClub" | "activity" | "transportation" | "pack";
  planDelegate?: "beachClubPlan" | "nightClubPlan" | "activityPlan" | "transportationPlan" | "packPlan";
  optionDelegate?: "beachClubPlanOption" | "nightClubPlanOption" | "activityPlanOption" | "transportationPlanOption" | "packPlanOption";
  parentForeignKey?: "beachClubId" | "nightClubId" | "activityId" | "transportationId" | "packId";
  pricingUnits?: readonly string[];
};

function fail(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function cleanTextFields(source: Record<string, unknown>) {
  const data = { ...source };
  for (const language of languages) {
    for (const prefix of textPrefixes) {
      const field = `${prefix}${language}`;
      if (!(field in data)) continue;
      const value = data[field];
      data[field] = typeof value === "string" && value.trim() ? value.trim() : null;
    }
  }
  return data;
}

function money(value: unknown, field: string, required = false) {
  if (value === null || value === undefined || value === "") {
    if (required) fail(`${field} is required.`);
    return null;
  }
  const normalized = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) fail(`${field} must be a positive amount with at most two decimals.`);
  return normalized;
}

function normalizeBase(body: Record<string, unknown>, creating: boolean) {
  const data = cleanTextFields(body);
  for (const field of ["id", "createdAt", "updatedAt", "images", "plans"]) delete data[field];
  delete data.gallery;
  for (const field of Object.keys(data)) if (/^image\d+$/.test(field)) delete data[field];
  if (creating || "uniqueCode" in data) {
    const code = String(data.uniqueCode ?? "").trim();
    if (!code) fail("uniqueCode is required.");
    data.uniqueCode = code;
  }
  if (creating || "thumbnail" in data) {
    const thumbnail = String(data.thumbnail ?? "").trim();
    if (!thumbnail) fail("thumbnail is required.");
    data.thumbnail = thumbnail;
  }
  if ("priceEuro" in data) data.priceEuro = money(data.priceEuro, "priceEuro");
  return data;
}

function imageWrites(body: Record<string, unknown>) {
  const hasGalleryInput = "gallery" in body || Object.keys(body).some((field) => /^image\d+$/.test(field));
  if (!hasGalleryInput) return null;
  const urls = Array.isArray(body.gallery)
    ? body.gallery.map(String).filter(Boolean).slice(0, 50)
    : Array.from({ length: 50 }, (_, index) => body[`image${index + 1}`]).map((value) => String(value ?? "").trim()).filter(Boolean);
  const alts = body.imageAlts && typeof body.imageAlts === "object" ? body.imageAlts as Record<string, Record<string, unknown>> : {};
  return urls.map((url, index) => {
    const translations = alts[`image${index + 1}`] ?? {};
    return {
      url,
      order: index,
      ...Object.fromEntries(languages.map((language) => [`alt${language}`, String(translations[language.toLowerCase()] ?? translations[language] ?? "").trim() || null])),
    };
  });
}

function normalizePlan(body: Record<string, unknown>, creating: boolean, pricingUnits: readonly string[] = []) {
  const data = cleanTextFields(body);
  for (const field of ["id", "createdAt", "updatedAt", "options", "beachClub", "nightClub", "activity", "transportation", "pack"]) delete data[field];
  if (creating || "uniqueCode" in data) {
    const code = String(data.uniqueCode ?? "").trim();
    if (!code) fail("uniqueCode is required.");
    data.uniqueCode = code;
  }
  if (creating || "salePrice" in data) data.salePrice = money(data.salePrice, "salePrice", true);
  if ("internalCost" in data) data.internalCost = money(data.internalCost, "internalCost");
  data.currency = "EUR";
  if ("pricingUnit" in data) {
    const unit = String(data.pricingUnit ?? "").trim().toUpperCase();
    if (!unit) data.pricingUnit = null;
    else if (!pricingUnits.includes(unit)) fail("Select a valid pricing unit.");
    else data.pricingUnit = unit;
  }
  return data;
}

function planDataForDelegate(data: Record<string, unknown>, delegate: NonNullable<DomainConfig["planDelegate"]>) {
  const common = new Set([
    "uniqueCode", "salePrice", "internalCost", "currency", "pricingUnit", "order", "isActive",
    ...languages.flatMap((language) => [`title${language}`, `description${language}`]),
  ]);
  const domainFields: Partial<Record<NonNullable<DomainConfig["planDelegate"]>, string[]>> = {
    beachClubPlan: [],
    nightClubPlan: ["durationMinutes"],
    activityPlan: ["durationMinutes", "minimumGuests", "maximumGuests"],
    transportationPlan: ["serviceType", "origin", "destination", "durationMinutes"],
    packPlan: ["serviceType", "origin", "destination", "durationMinutes"],
  };
  const allowed = new Set([...common, ...(domainFields[delegate] ?? [])]);
  return Object.fromEntries(Object.entries(data).filter(([field]) => allowed.has(field)));
}

function normalizeOption(body: Record<string, unknown>) {
  const data = cleanTextFields(body);
  for (const field of ["id", "planId", "createdAt", "updatedAt", "plan"]) delete data[field];
  if (!data.titleEN && !data.titleFR && !data.titleDE && !data.titleIT && !data.titlePT && !data.titleES) {
    fail("At least one translated option title is required.");
  }
  return data;
}

export function createCatalogDomainService(config: DomainConfig) {
  const db = prisma as any;
  const delegate = db[config.delegate];
  const include = config.planDelegate
    ? { images: { orderBy: { order: "asc" } }, plans: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } }
    : { images: { orderBy: { order: "asc" } } };
  const listInclude = config.planDelegate ? { plans: { where: { isActive: true }, orderBy: { salePrice: "asc" }, take: 1, select: { salePrice: true, currency: true } } } : undefined;
  const present = (row: any) => {
    const cheapest = config.planDelegate ? row.plans?.filter((plan: any) => plan.isActive !== false)?.sort((a: any, b: any) => Number(a.salePrice) - Number(b.salePrice))[0] : null;
    const minimumPrice = config.delegate === "villa" || config.delegate === "restaurant" ? row.priceEuro : cheapest?.salePrice ?? null;
    const minimumCurrency = config.delegate === "villa" || config.delegate === "restaurant" ? (minimumPrice == null ? null : "EUR") : cheapest?.currency ?? null;
    return { ...row, minimumPrice, minimumCurrency };
  };
  const baseData = (body: Record<string, unknown>, creating: boolean) => {
    const data = normalizeBase(body, creating);
    if (config.delegate !== "villa" && config.delegate !== "restaurant") delete data.imageAlts;
    return data;
  };

  return {
    async list(query: Record<string, string | undefined>) {
      const page = Math.max(1, Number(query.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
      const activeFilter = query.isActive ?? (query.filterField === "isActive" ? query.filterValue : undefined);
      const where = {
        ...(activeFilter === "true" ? { isActive: true } : activeFilter === "false" ? { isActive: false } : {}),
        ...(query.search ? { OR: languages.map((language) => ({ [`title${language}`]: { contains: query.search, mode: "insensitive" } })) } : {}),
      };
      const [items, total] = await Promise.all([
        delegate.findMany({ where, include: listInclude, skip: (page - 1) * pageSize, take: pageSize, orderBy: { updatedAt: "desc" } }),
        delegate.count({ where }),
      ]);
      return { items: items.map(present), total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
    },
    async one(id: string) {
      const row = await delegate.findUnique({ where: { id }, include });
      if (!row) throw Object.assign(new Error("Not found"), { status: 404 });
      return present(row);
    },
    async create(body: Record<string, unknown>) {
      const images = imageWrites(body);
      return present(await delegate.create({ data: { ...baseData(body, true), ...(images ? { images: { create: images } } : {}) }, include }));
    },
    async update(id: string, body: Record<string, unknown>) {
      const images = imageWrites(body);
      return present(await delegate.update({ where: { id }, data: { ...baseData(body, false), ...(images ? { images: { deleteMany: {}, create: images } } : {}) }, include }));
    },
    async remove(id: string) {
      await delegate.delete({ where: { id } });
    },
    async createPlan(parentId: string, body: Record<string, unknown>) {
      if (!config.planDelegate || !config.parentForeignKey) fail("This domain does not support plans.");
      const planDelegate = db[config.planDelegate!];
      const data = planDataForDelegate(normalizePlan(body, true, config.pricingUnits), config.planDelegate);
      data[config.parentForeignKey!] = parentId;
      return planDelegate.create({ data, include: { options: { orderBy: { order: "asc" } } } });
    },
    async updatePlan(id: string, body: Record<string, unknown>) {
      if (!config.planDelegate) fail("This domain does not support plans.");
      const data = planDataForDelegate(normalizePlan(body, false, config.pricingUnits), config.planDelegate);
      return db[config.planDelegate].update({ where: { id }, data, include: { options: { orderBy: { order: "asc" } } } });
    },
    async removePlan(id: string) {
      if (!config.planDelegate) fail("This domain does not support plans.");
      await db[config.planDelegate!].delete({ where: { id } });
    },
    async createOption(planId: string, body: Record<string, unknown>) {
      if (!config.optionDelegate) fail("This domain does not support plan options.");
      return db[config.optionDelegate!].create({ data: { ...normalizeOption(body), planId } });
    },
    async updateOption(id: string, body: Record<string, unknown>) {
      if (!config.optionDelegate) fail("This domain does not support plan options.");
      return db[config.optionDelegate!].update({ where: { id }, data: normalizeOption(body) });
    },
    async removeOption(id: string) {
      if (!config.optionDelegate) fail("This domain does not support plan options.");
      await db[config.optionDelegate!].delete({ where: { id } });
    },
  };
}
