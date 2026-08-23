import "./globals.css";
import Providers from "../components/Providers";
import LayoutContent from "../components/LayoutContent";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPageTitle } from "@/lib/page-title";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders =
    await headers();
  const publicPathname =
    requestHeaders.get(
      "x-moorish-public-pathname"
    ) ?? "/";
  const { title } =
    getPageTitle(
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
    description:
      "Private concierge services, luxury stays, experiences and transportation in Marrakech.",
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      siteName: "Moorish Concierge",
      title,
      description: "Private concierge services, luxury stays, experiences and transportation in Marrakech.",
      url: canonical,
      images: [{
        url: "https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public",
        alt: "Moorish Concierge",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: "Private concierge services, luxury stays, experiences and transportation in Marrakech.",
      images: ["https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public"],
    },
    icons: {
      icon:
        "https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public",
      shortcut:
        "https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public",
      apple:
        "https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public",
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
    getPageTitle(
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
              image: "https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/06b8c914-294e-4155-bb81-627ccaf3fa00/public",
              address: { "@type": "PostalAddress", addressLocality: "Marrakech", addressCountry: "MA" },
              areaServed: "Marrakech",
              telephone: "+212613859834",
              email: "contact@moorishconcierge.com",
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
