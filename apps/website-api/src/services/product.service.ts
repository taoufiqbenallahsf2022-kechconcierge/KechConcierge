import { prisma } from "../config/prisma";

const languages = ["FR", "EN", "DE", "IT", "PT", "ES"] as const;
type Language = (typeof languages)[number];

const productTypes = [
  "VILLA",
  "APARTMENT",
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
  };

  if (!full) return base;

  return {
    ...base,
    description: product[`description${lang}`],
    tags: product[`tags${lang}`],
    details: product[`details${lang}`],

    image1: product.image1,
    image2: product.image2,
    image3: product.image3,
    image4: product.image4,
    image5: product.image5,
    image6: product.image6,
    image7: product.image7,
    image8: product.image8,
    image9: product.image9,
    image10: product.image10,
    image11: product.image11,
    image12: product.image12,
    image13: product.image13,
    image14: product.image14,
    image15: product.image15,
    image16: product.image16,
    image17: product.image17,
    image18: product.image18,
    image19: product.image19,
    image20: product.image20,
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