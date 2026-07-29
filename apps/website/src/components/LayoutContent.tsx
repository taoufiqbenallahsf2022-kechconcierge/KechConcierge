"use client";

import {
  usePathname,
} from "next/navigation";

import Header from "./Header";
import Footer from "./Footer";
import FloatingContact from "./FloatingContact";
import PreferredLanguagePrompt from "./PreferredLanguagePrompt";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname =
    usePathname();

  const isChatPage =
    pathname
      .split("/")
      .filter(Boolean)
      .includes("chat");

  return (
    <>
      {!isChatPage && (
        <Header />
      )}

      <main>
        {children}
      </main>

      {!isChatPage && (
        <Footer />
      )}

      {!isChatPage && (
        <FloatingContact />
      )}

      {!isChatPage && (
        <PreferredLanguagePrompt />
      )}
    </>
  );
}
