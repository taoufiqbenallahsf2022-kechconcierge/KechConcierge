"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

export type ChatProductRecommendation = {
  id: string; type: string; uniqueCode: string; title: string; subtitle: string;
  url: string; images: string[]; address: string; priceEuro: number | null;
  priceTitle: string; planTitle: string | null; pricingUnit: string | null; driverLabel: string | null;
};
const languages = ["en", "fr", "de", "it", "pt", "es"];
const labels = {
  en: { title: "Selected for you", book: "Book now", from: "From", request: "Price on request", previous: "Previous products", next: "Next products" },
  fr: { title: "Notre sélection pour vous", book: "Réserver", from: "À partir de", request: "Prix sur demande", previous: "Produits précédents", next: "Produits suivants" },
  de: { title: "Für Sie ausgewählt", book: "Jetzt buchen", from: "Ab", request: "Preis auf Anfrage", previous: "Vorherige Angebote", next: "Nächste Angebote" },
  it: { title: "Selezionati per te", book: "Prenota ora", from: "Da", request: "Prezzo su richiesta", previous: "Proposte precedenti", next: "Proposte successive" },
  pt: { title: "Selecionados para si", book: "Reservar agora", from: "Desde", request: "Preço sob consulta", previous: "Ofertas anteriores", next: "Ofertas seguintes" },
  es: { title: "Seleccionados para ti", book: "Reservar ahora", from: "Desde", request: "Precio a consultar", previous: "Productos anteriores", next: "Productos siguientes" },
};
const categories: Record<string, string[]> = {
  VILLA: ["Villa", "Villa", "Villa", "Villa", "Villa", "Villa"],
  TRANSPORTATION: ["Transportation", "Transport", "Transport", "Trasporto", "Transporte", "Transporte"],
  SWIMMINGPOOL: ["Beach club", "Beach club", "Beachclub", "Beach club", "Beach club", "Beach club"],
  NIGHTCLUB: ["Nightlife", "Vie nocturne", "Nachtleben", "Vita notturna", "Vida noturna", "Vida nocturna"],
  ACTIVITY: ["Experience", "Expérience", "Erlebnis", "Esperienza", "Experiência", "Experiencia"],
  RESTAURANT: ["Restaurant", "Restaurant", "Restaurant", "Ristorante", "Restaurante", "Restaurante"],
};
const units: Record<string, string[]> = {
  PER_PERSON: ["/ person", "/ personne", "/ Person", "/ persona", "/ pessoa", "/ persona"],
  PER_ADULT: ["/ adult", "/ adulte", "/ Erwachsener", "/ adulto", "/ adulto", "/ adulto"],
  PER_CHILD: ["/ child", "/ enfant", "/ Kind", "/ bambino", "/ criança", "/ niño"],
  PER_VEHICLE: ["/ vehicle", "/ véhicule", "/ Fahrzeug", "/ veicolo", "/ veículo", "/ vehículo"],
  PER_TRIP: ["/ trip", "/ trajet", "/ Fahrt", "/ viaggio", "/ viagem", "/ trayecto"],
  PER_HOUR: ["/ hour", "/ heure", "/ Stunde", "/ ora", "/ hora", "/ hora"],
  HALF_DAY: ["/ half day", "/ demi-journée", "/ halber Tag", "/ mezza giornata", "/ meio dia", "/ medio día"],
  FULL_DAY: ["/ day", "/ journée", "/ Tag", "/ giornata", "/ dia", "/ día"],
  PER_CABANA: ["/ cabana", "/ cabana", "/ Cabana", "/ cabana", "/ cabana", "/ cabaña"],
  PER_TABLE: ["/ table", "/ table", "/ Tisch", "/ tavolo", "/ mesa", "/ mesa"],
  PER_GROUP: ["/ group", "/ groupe", "/ Gruppe", "/ gruppo", "/ grupo", "/ grupo"],
  PER_SUNBED: ["/ sunbed", "/ transat", "/ Liege", "/ lettino", "/ espreguiçadeira", "/ tumbona"],
  FIXED: ["fixed price", "prix fixe", "Festpreis", "prezzo fisso", "preço fixo", "precio fijo"],
};

function ProductCard({ product, locale, gallery }: { product: ChatProductRecommendation; locale: Locale; gallery: boolean }) {
  const t = labels[locale], index = Math.max(0, languages.indexOf(locale));
  const [imageIndex, setImageIndex] = useState(0);
  const images = gallery ? product.images : product.images.slice(0, 1);
  const category = categories[product.type]?.[index] || "";
  const price = product.priceEuro == null ? null : new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(product.priceEuro);
  const validUrl = /^\/(?:(?:fr|de|it|es|pt)\/)?(?:villas|transportation|beachclubs|nightclubs|experiences|restaurants)\/[^/?#\\]+$/.test(product.url);
  if (!validUrl) return null;
  return (
    <Link href={product.url} target="_blank" rel="noopener noreferrer" prefetch={false}
      aria-label={`${product.title} — ${t.book}`}
    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500">
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-100 via-stone-100 to-orange-50">
        <div className="flex aspect-[16/10] snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={event => { const el = event.currentTarget; setImageIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }}>
          {images.length ? images.map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-full w-full shrink-0 snap-start overflow-hidden">
              {/* Catalog URLs are server-selected; native images also support the current environment's media hosts. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${product.title} — ${i + 1}`} loading="lazy" decoding="async" draggable={false}
                onError={event => { event.currentTarget.style.visibility = "hidden"; }}
                className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.035]" />
            </div>
          )) : <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-orange-900/50">{category}</div>}
        </div>
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-700 shadow-sm">{category}</span>
        {images.length > 1 && <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white">{imageIndex + 1} / {images.length}</span>}
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-2 text-sm font-extrabold leading-[1.3] text-zinc-900">{product.title}</h3>
        {(product.planTitle || product.driverLabel) && <p className="mt-1.5 line-clamp-1 text-[11px] leading-4 text-stone-600" title={product.planTitle || product.driverLabel || undefined}>{product.planTitle || product.driverLabel}</p>}
        <div className="mt-auto pt-2.5">
          {price ? <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            {!product.planTitle && <span className="text-xs text-stone-500">{t.from}</span>}
            <span className="text-lg font-extrabold tracking-tight text-orange-700">{price}</span>
            {product.pricingUnit && <span className="text-[10px] text-stone-500">{units[product.pricingUnit]?.[index] || ""}</span>}
          </div> : <p className="text-sm font-semibold text-stone-600">{t.request}</p>}
          <span className="mt-2 flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-orange-600 px-3 py-1.5 text-xs font-bold text-white transition-colors group-hover:bg-orange-700">{t.book}<ArrowUpRight size={14} aria-hidden="true" /></span>
        </div>
      </div>
    </Link>
  );
}

export function ChatProductRecommendations({ products, locale }: { products: ChatProductRecommendation[]; locale: Locale }) {
  const track = useRef<HTMLDivElement>(null), t = labels[locale];
  if (!products.length) return null;
  const move = (direction: number) => {
    const element = track.current;
    if (!element) return;
    const card = element.firstElementChild as HTMLElement | null;
    element.scrollBy({ left: direction * ((card?.offsetWidth || 200) + 10), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return <section className="mt-3 min-w-0" aria-label={t.title}>
    <div className="mb-1 flex items-center justify-between gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[.12em] text-stone-500">{t.title}</p>
      {products.length > 1 && <div className="flex gap-1.5">
        <button type="button" onClick={() => move(-1)} aria-label={t.previous} className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-100 text-stone-600 hover:bg-orange-50"><ArrowLeft size={15} /></button>
        <button type="button" onClick={() => move(1)} aria-label={t.next} className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-100 text-stone-600 hover:bg-orange-50"><ArrowRight size={15} /></button>
      </div>}
    </div>
    <div ref={track} tabIndex={0} className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-1.5 outline-offset-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {products.map((product, index) => <div key={`${product.id}-${product.planTitle}-${index}`} className="shrink-0 snap-start" style={{ width: "min(200px, calc(100vw - 7rem))" }}><ProductCard product={product} locale={locale} gallery={products.length === 1} /></div>)}
    </div>
  </section>;
}
