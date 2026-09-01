import type { MetadataRoute } from "next";
import { apiBaseUrl, categoryByProductType } from "@/lib/product-seo";

const routes = ["", "/about", "/services", "/contact", "/villas", "/transportation", "/beachclubs", "/nightclubs", "/experiences", "/packs", "/restaurants", "/spa", "/terms"];
const languages = ["en", "fr", "de", "it", "pt", "es"] as const;
type SeoIndexProduct = { type: string; uniqueCode: string; updatedAt: string };

function localizedPath(language: string, path: string) {
  return `${language === "en" ? "" : `/${language}`}${path || "/"}`;
}

function languageAlternates(siteUrl: string, path: string) {
  return {
    ...Object.fromEntries(languages.map((language) => [language, new URL(localizedPath(language, path), siteUrl).toString()])),
    "x-default": new URL(localizedPath("en", path), siteUrl).toString(),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com";
  const staticPages: MetadataRoute.Sitemap = routes.flatMap((route) => languages.map((language) => ({
    url: new URL(localizedPath(language, route), siteUrl).toString(),
    alternates: { languages: languageAlternates(siteUrl, route) },
    changeFrequency: route === "" ? "daily" as const : "weekly" as const,
    priority: route === "" ? 1 : route === "/terms" ? 0.3 : 0.8,
  })));

  try {
    const response = await fetch(`${apiBaseUrl()}/api/products/seo-index`, { next: { revalidate: 300 } });
    if (!response.ok) return staticPages;
    const products = (await response.json()) as SeoIndexProduct[];
    const productPages: MetadataRoute.Sitemap = products.flatMap((product) => {
      const category = categoryByProductType[product.type];
      if (!category) return [];
      return languages.map((language) => ({
        url: new URL(localizedPath(language, `/${category}/${product.uniqueCode}`), siteUrl).toString(),
        alternates: { languages: languageAlternates(siteUrl, `/${category}/${product.uniqueCode}`) },
        lastModified: new Date(product.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }));
    });
    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
