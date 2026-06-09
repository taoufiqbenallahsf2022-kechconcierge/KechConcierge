"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import FloatingContact from "./FloatingContact";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isChatPage = pathname.startsWith("/chat");

  return (
    <>
      {!isChatPage && <Header />}

      <main>{children}</main>

      {!isChatPage && <Footer />}
      {!isChatPage && <FloatingContact />}
    </>
  );
}