import { prisma } from "../config/prisma";

const languages = ["FR", "EN", "DE", "IT", "PT", "ES"] as const;
type Language = (typeof languages)[number];

const productTypes = [
  "VILLA",
  "SWIMMINGPOOL",
  "ACTIVITY",
  "SPA",
  "TRANSPORTATION",
  "RESTAURANT",
];

function normalizeLang(lang?: string): Language {
  const upperLang = lang?.toUpperCase();

  if (languages.includes(upperLang as Language)) {
    return upperLang as Language;
  }

  return "EN";
}

function mapProduct(product: any, lang: Language, full = false) {
  const localizedImageAlts = Object.fromEntries(
    Object.entries(product.imageAlts ?? {}).map(([key, translations]: [string, any]) => [
      key,
      translations?.[lang.toLowerCase()] || translations?.EN || translations?.en || "",
    ]),
  );
  const base = {
    id: product.id,
    type: product.type,
    uniqueCode: product.uniqueCode,
    order: product.order,
    thumbnail: product.thumbnail,
    priceEuro: product.priceEuro,

    title: product[`title${lang}`],
    subtitle: product[`subtitle${lang}`],
    priceTitle: product[`priceTitle${lang}`],
    address: product[`address${lang}`],
    thumbnailAlt: localizedImageAlts.thumbnail || product[`title${lang}`] || "",
  };

  if (!full) return base;

  const gallery = Object.fromEntries(
    Array.from({ length: 50 }, (_, index) => {
      const key = `image${index + 1}`;
      return [key, product[key]];
    }),
  );
  return {
    ...base,
    description: product[`description${lang}`],
    tags: product[`tags${lang}`],
    details: product[`details${lang}`],

    ...gallery,
    imageAlts: localizedImageAlts,
  };
}

export async function getHomeProducts(lang?: string) {
  const language = normalizeLang(lang);
  const result: Record<string, any[]> = {};

  for (const type of productTypes) {
    const products = await prisma.product.findMany({
      where: {
        type: type as any,
        isActive: true,
        order: {
          gte: 1,
          lte: 10,
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    result[type.toLowerCase()] = products.map((product) =>
      mapProduct(product, language)
    );
  }

  return result;
}

export async function getProductsByType(type: string, page: number, lang?: string) {
  const language = normalizeLang(lang);
  const take = 12;
  const skip = (page - 1) * take;

  const normalizedType = type.toUpperCase();

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        type: normalizedType as any,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    }),
    prisma.product.count({
      where: {
        type: normalizedType as any,
        isActive: true,
      },
    }),
  ]);

  return {
    page,
    perPage: take,
    total,
    totalPages: Math.ceil(total / take),
    items: products.map((product) => mapProduct(product, language)),
  };
}

export async function getProductDetails(uniqueCode: string, lang?: string) {
  const language = normalizeLang(lang);

  const product = await prisma.product.findUnique({
    where: {
      uniqueCode,
    },
  });

  if (!product) return null;

  return mapProduct(product, language, true);
}
