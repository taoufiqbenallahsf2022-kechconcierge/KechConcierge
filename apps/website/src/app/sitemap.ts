import type { MetadataRoute } from "next";

const routes = ["", "/about", "/services", "/contact", "/villas", "/transportation", "/swimmingpools", "/activities", "/restaurants", "/spa", "/terms"];
const languages = ["en", "fr", "de", "it", "pt", "es"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com";
  const now = new Date();
  return routes.flatMap((route) => languages.map((language) => ({
    url: `${siteUrl}${language === "en" ? "" : `/${language}`}${route || "/"}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" as const : "weekly" as const,
    priority: route === "" ? 1 : route === "/terms" ? 0.3 : 0.8,
  })));
}
