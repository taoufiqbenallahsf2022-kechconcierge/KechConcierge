"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getDictionary,
  getLocaleFromPath,
} from "../lib/i18n";

function localizePath(
  path: string,
  locale: string
) {
  if (locale === "en") {
    return path;
  }

  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}

export default function Footer() {
  const pathname = usePathname();

  const locale =
    getLocaleFromPath(pathname);

  const t =
    getDictionary(locale);

  const whatsappNumber =
    process.env
      .NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "+212 6 13 85 98 34";

  const contactEmail =
    process.env
      .NEXT_PUBLIC_CONTACT_EMAIL ||
    "contact@moorishconcierge.com";

  return (
    <footer className="mt-16 bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-2xl font-black">
            Moorish Concierge
          </p>

          <p className="mt-4 max-w-sm leading-7 text-zinc-400">
            {t.footer.description}
          </p>

          <p className="mt-5 text-sm font-bold text-orange-400">
            {t.footer.slogan}
          </p>
        </div>

        <div>
          <p className="font-black">
            {t.footer.menu}
          </p>

          <div className="mt-4 flex flex-col items-start gap-3 text-zinc-400">
            <FooterLink
              href={localizePath(
                "/services",
                locale
              )}
            >
              {t.footer.services}
            </FooterLink>

            <FooterLink
              href={localizePath(
                "/villas",
                locale
              )}
            >
              {t.footer.villas}
            </FooterLink>

            <FooterLink
              href={localizePath(
                "/swimmingpools",
                locale
              )}
            >
              {t.footer.swimmingPools}
            </FooterLink>

            <FooterLink
              href={localizePath(
                "/chat",
                locale
              )}
            >
              {t.footer.chat}
            </FooterLink>

            <FooterLink
              href={localizePath(
                "/contact",
                locale
              )}
            >
              {t.footer.contact}
            </FooterLink>
          </div>
        </div>

        <div>
          <p className="font-black">
            {t.footer.legalTitle}
          </p>

          <div className="mt-4 flex flex-col items-start gap-3 text-zinc-400">
            <FooterLink
              href={localizePath(
                "/terms",
                locale
              )}
            >
              {t.footer.terms}
            </FooterLink>

            <FooterLink
              href={localizePath(
                "/terms#privacy",
                locale
              )}
            >
              {t.footer.privacy}
            </FooterLink>

            <FooterLink
              href={localizePath(
                "/terms#consent",
                locale
              )}
            >
              {t.footer.consentPreferences}
            </FooterLink>

            <FooterLink
              href={localizePath(
                "/terms#guest-conduct",
                locale
              )}
            >
              {t.footer.guestResponsibilities}
            </FooterLink>
          </div>
        </div>

        <div>
          <p className="font-black">
            {t.footer.contactTitle}
          </p>

          <div className="mt-4 space-y-2 text-zinc-400">
            <p>
              {t.footer.location}
            </p>

            <a
              href={`mailto:${contactEmail}`}
              className="block break-all transition hover:text-orange-400"
            >
              {contactEmail}
            </a>

            <a
              href={`https://wa.me/${whatsappNumber.replace(
                /\D/g,
                ""
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block transition hover:text-orange-400"
            >
              {whatsappNumber}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-sm text-zinc-500 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()}{" "}
            Moorish Concierge.{" "}
            {t.footer.copyright}
          </p>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link
              href={localizePath(
                "/terms",
                locale
              )}
              className="transition hover:text-orange-400"
            >
              {t.footer.termsShort}
            </Link>

            <Link
              href={localizePath(
                "/terms#privacy",
                locale
              )}
              className="transition hover:text-orange-400"
            >
              {t.footer.privacyShort}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="transition hover:text-orange-400"
    >
      {children}
    </Link>
  );
}