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
      <div className="mx-auto grid max-w-[1380px] gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 xl:px-8">
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
                "/beachclubs",
                locale
              )}
            >
              Beach Clubs
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

          <div className="mt-6 flex items-center gap-3" aria-label="Social media">
            <SocialLink href="https://www.instagram.com/moorishconcierge" label="Instagram"><InstagramIcon /></SocialLink>
            <SocialLink href="https://www.tiktok.com/@moorish.concierge" label="TikTok"><TikTokIcon /></SocialLink>
            <SocialLink href="https://www.facebook.com/share/14o3RJ2x9Pc/?mibextid=wwXlfr" label="Facebook"><FacebookIcon /></SocialLink>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1380px] flex-col items-center justify-between gap-3 px-5 py-5 text-center text-sm text-zinc-500 sm:flex-row sm:text-left xl:px-8">
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

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-zinc-300 transition hover:-translate-y-0.5 hover:border-orange-500 hover:bg-orange-600 hover:text-white">{children}</a>;
}

function TikTokIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82a5.86 5.86 0 0 1-1.38-3.42h-3.56v13.74a2.99 2.99 0 1 1-2.58-2.96v-3.6a6.58 6.58 0 1 0 6.14 6.56V9.17a9.35 9.35 0 0 0 5.46 1.75V7.36a5.9 5.9 0 0 1-4.08-1.54Z" /></svg>;
}

function InstagramIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
}

function FacebookIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.7 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5H17V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.5V13h2.8v8h3.4Z" /></svg>;
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
