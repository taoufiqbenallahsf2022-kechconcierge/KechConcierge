"use client";

import {
  usePathname,
} from "next/navigation";
import { useEffect } from "react";

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

  const isNightClubPage = pathname.split("/").filter(Boolean).includes("nightclubs");

  useEffect(() => {
    document.body.classList.toggle("nightclub-theme", isNightClubPage);
    return () => document.body.classList.remove("nightclub-theme");
  }, [isNightClubPage]);

  useEffect(() => {
    const contentProtectionEnabled =
      process.env.NEXT_PUBLIC_CONTENT_PROTECTION_ENABLED === "true";

    if (!contentProtectionEnabled) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;

      return Boolean(
        target.closest(
          "input, textarea, select, [contenteditable='true'], [role='textbox']",
        ),
      );
    };

    const preventContextMenu = (event: MouseEvent) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };

    const preventProtectedDrag = (event: DragEvent) => {
      if (event.target instanceof HTMLImageElement) event.preventDefault();
    };

    const preventProtectedShortcuts = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const developerShortcut =
        event.key === "F12" ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          ["c", "i", "j"].includes(key));
      const contentShortcut =
        (event.ctrlKey || event.metaKey) && ["c", "s", "u"].includes(key);

      if (developerShortcut || contentShortcut) event.preventDefault();
    };

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("dragstart", preventProtectedDrag);
    document.addEventListener("keydown", preventProtectedShortcuts);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("dragstart", preventProtectedDrag);
      document.removeEventListener("keydown", preventProtectedShortcuts);
    };
  }, []);

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
