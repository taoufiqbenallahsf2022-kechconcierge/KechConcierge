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

  return {
    title,
    description:
      "Private concierge services, luxury stays, experiences and transportation in Marrakech.",
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
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
