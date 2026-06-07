"use client";

import type { Metadata } from "next";
import "./globals.css";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isChatPage = pathname.startsWith("/chat");

  return (
    <html lang="en">
      <body>
        {!isChatPage && <Header />}

        <main>{children}</main>

        {!isChatPage && <Footer />}
        {!isChatPage && <FloatingContact />}
      </body>
    </html>
  );
}