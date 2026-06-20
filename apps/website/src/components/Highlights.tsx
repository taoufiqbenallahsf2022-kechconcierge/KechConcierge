"use client";

import { usePathname } from "next/navigation";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";

function localizePath(path: string, locale: string) {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export default function Highlights() { 
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  return (
    
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: t.highlights.curatedStaysTitle,
              description: t.highlights.curatedStaysDescription,
            },
            {
              title: t.highlights.localExperiencesTitle,
              description: t.highlights.localExperiencesDescription,
            },
            {
              title: t.highlights.easyContactTitle,
              description: t.highlights.easyContactDescription,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl bg-white p-7 card-shadow"
            >
              <p className="text-xl font-black text-zinc-950">
                {item.title}
              </p>

              <p className="mt-3 leading-7 text-zinc-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
  );
}