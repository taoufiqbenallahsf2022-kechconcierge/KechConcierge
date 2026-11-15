import { headers } from "next/headers";
import { getLocaleFromPath } from "@/lib/i18n";
import { getHomeProducts, getHeroConfiguration } from "@/lib/public-content.server";
import Hero from "@/components/Hero";
import HorizontalSection from "@/components/HorizontalSection";
import HomePageContact from "@/components/HomePageContact";

export default async function Home() {
  const requestHeaders = await headers();
  const locale = getLocaleFromPath(requestHeaders.get("x-moorish-public-pathname") || "/");
  const [products, hero] = await Promise.all([getHomeProducts(locale), getHeroConfiguration(locale)]);
  const initialProducts = products.status === "ok" ? products.data : undefined;
  const initialConfiguration = hero.status === "ok" ? hero.data : undefined;

  return (
    <>
      <Hero key={locale} initialLocale={locale} initialConfiguration={initialConfiguration} />

      <HorizontalSection key={locale + "-villas"} category="villas" initialLocale={locale} initialProducts={initialProducts} />
      <HorizontalSection key={locale + "-transportation"} category="transportation" initialLocale={locale} initialProducts={initialProducts} />
      <HorizontalSection key={locale + "-restaurants"} category="restaurants" initialLocale={locale} initialProducts={initialProducts} />
      <HorizontalSection key={locale + "-nightclubs"} category="nightclubs" initialLocale={locale} initialProducts={initialProducts} />
      <HorizontalSection key={locale + "-beachclubs"} category="beachclubs" initialLocale={locale} initialProducts={initialProducts} />
      <HorizontalSection key={locale + "-experiences"} category="experiences" initialLocale={locale} initialProducts={initialProducts} />

      <HomePageContact />
    </>
  );
}
