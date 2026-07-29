"use client";

import { usePathname } from "next/navigation";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";
import Link from "next/link";

function localizePath(path: string, locale: string) {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export default function HomePageContact() { 
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-[2rem] bg-zinc-950 p-8 text-white md:p-12">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-400">
            {t.contactSection.eyebrow}
            </p>

            <h2 className="mt-3 max-w-3xl text-4xl font-black">
            {t.contactSection.title}
            </h2>

            <p className="mt-4 max-w-2xl text-zinc-300">
            {t.contactSection.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
                href={locale === "en" ? "/contact" : `/${locale}/contact`}
                className="inline-block rounded-full bg-orange-600 px-7 py-4 text-center font-black text-white transition hover:bg-orange-700"
            >
                {t.contactSection.contactForm}
            </Link>

            <Link
                href={locale === "en" ? "/chat" : `/${locale}/chat`}
                className="inline-block rounded-full bg-white px-7 py-4 text-center font-black text-zinc-950 transition hover:bg-orange-50"
            >
                {t.contactSection.openChat}
            </Link>
            </div>
        </div>
    </section>
  );
}

