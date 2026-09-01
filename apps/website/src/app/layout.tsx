import "./globals.css";
import Providers from "../components/Providers";
import LayoutContent from "../components/LayoutContent";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPageMetadata } from "@/lib/page-title";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders =
    await headers();
  const publicPathname =
    requestHeaders.get(
      "x-moorish-public-pathname"
    ) ?? "/";
  const { title, description, isPrivate } =
    getPageMetadata(
      publicPathname
    );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com";
  const segments = publicPathname.split("/").filter(Boolean);
  const supported = ["fr", "de", "it", "pt", "es"];
  if (supported.includes(segments[0])) segments.shift();
  const basePath = `/${segments.join("/")}` || "/";
  const canonical = new URL(publicPathname, siteUrl).toString();
  const languages = Object.fromEntries([
    ["en", new URL(basePath, siteUrl).toString()],
    ...supported.map((language) => [language, new URL(`/${language}${basePath === "/" ? "" : basePath}`, siteUrl).toString()]),
  ]);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    robots: isPrivate ? { index: false, follow: false, noarchive: true } : { index: true, follow: true },
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      siteName: "Moorish Concierge",
      title,
      description,
      url: canonical,
      images: [{
        url: "https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public",
        alt: "Moorish Concierge",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public"],
    },
    icons: {
      icon: "/brand/original-m-mark.png",
      shortcut: "/brand/original-m-mark.png",
      apple: "/brand/original-m-mark.png",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders =
    await headers();
  const publicPathname =
    requestHeaders.get(
      "x-moorish-public-pathname"
    ) ?? "/";
  const { locale } =
    getPageMetadata(
      publicPathname
    );

  return (
    <html lang={locale}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Moorish Concierge",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com",
              logo: new URL("/brand/original-m-mark.png", process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com").toString(),
              image: "https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public",
              address: { "@type": "PostalAddress", addressLocality: "Marrakech", addressCountry: "MA" },
              areaServed: "Marrakech",
              telephone: "+212613859834",
              email: "contact@moorishconcierge.com",
              sameAs: [
                "https://www.instagram.com/moorishconcierge",
                "https://www.tiktok.com/@moorish.concierge",
                "https://www.facebook.com/share/14o3RJ2x9Pc/?mibextid=wwXlfr",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Moorish Concierge",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com",
              inLanguage: ["en", "fr", "es", "pt", "it", "de"],
              publisher: {
                "@type": "Organization",
                name: "Moorish Concierge",
                logo: new URL("/brand/original-m-mark.png", process.env.NEXT_PUBLIC_SITE_URL || "https://moorishconcierge.com").toString(),
              },
            }),
          }}
        />
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
