"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary, getLocaleFromPath } from "../lib/i18n";

function localizePath(path: string, locale: string) {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export default function Footer() {
  const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  "+212 6 13 85 98 34";

  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  return (
    <footer className="mt-16 bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-2xl font-black">Moorish Concierge</p>

          <p className="mt-4 max-w-md text-zinc-400">
            {t.footer.description}
          </p>
        </div>

        <div>
          <p className="font-black">{t.footer.menu}</p>

          <div className="mt-4 flex flex-col gap-2 text-zinc-400">
            <Link href={localizePath("/services", locale)}>
              {t.footer.services}
            </Link>

            <Link href={localizePath("/villas", locale)}>
              {t.footer.villas}
            </Link>

            <Link href={localizePath("/swimmingpools", locale)}>
              {t.footer.swimmingPools}
            </Link>

            <Link href={localizePath("/chat", locale)}>
              {t.footer.chat}
            </Link>

            <Link href={localizePath("/contact", locale)}>
              {t.footer.contact}
            </Link>
          </div>
        </div>

        <div>
          <p className="font-black">{t.footer.contactTitle}</p>

          <div className="mt-4 text-zinc-400">
            <p>{t.footer.location}</p>
            <p>contact@kechconcierge.local</p>
            <p>{WHATSAPP_NUMBER}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Moorish Concierge. {t.footer.copyright}
      </div>
    </footer>
  );
}