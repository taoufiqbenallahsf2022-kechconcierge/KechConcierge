"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/store/product-details.store";

type Plan = ProductDetails["plans"][number];
type Props = { open: boolean; locale: Locale; plans: Plan[]; onClose: () => void; onBook: (planId: string) => void };

const copy = {
  en: { title: "Available plans", count: "plan", book: "Book this plan", included: "Included", previous: "Previous plan", next: "Next plan" },
  fr: { title: "Formules disponibles", count: "formule", book: "Réserver cette formule", included: "Inclus", previous: "Formule précédente", next: "Formule suivante" },
  es: { title: "Planes disponibles", count: "plan", book: "Reservar este plan", included: "Incluido", previous: "Plan anterior", next: "Plan siguiente" },
  pt: { title: "Planos disponíveis", count: "plano", book: "Reservar este plano", included: "Incluído", previous: "Plano anterior", next: "Próximo plano" },
  it: { title: "Piani disponibili", count: "piano", book: "Prenota questo piano", included: "Incluso", previous: "Piano precedente", next: "Piano successivo" },
  de: { title: "Verfügbare Angebote", count: "Angebot", book: "Dieses Angebot buchen", included: "Inklusive", previous: "Vorheriges Angebot", next: "Nächstes Angebot" },
} as const;

export default function ProductPlansModal({ open, locale, plans, onClose, onBook }: Props) {
  const [index, setIndex] = useState(0);
  const desktopScroller = useRef<HTMLDivElement>(null);
  const text = copy[locale];
  const multiplePlans = plans.length > 1;

  const move = useCallback((direction: -1 | 1) => {
    setIndex((current) => {
      const next = Math.max(0, Math.min(plans.length - 1, current + direction));
      desktopScroller.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      return next;
    });
  }, [plans.length]);

  useEffect(() => {
    if (open) {
      setIndex(0);
      desktopScroller.current?.scrollTo({ left: 0 });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", keydown); };
  }, [move, onClose, open]);

  if (!open || typeof document === "undefined" || !plans.length) return null;
  const plan = plans[index];

  return createPortal(
    <div className="fixed inset-0 z-[75] bg-zinc-950/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={text.title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex h-[100dvh] w-full flex-col bg-[#fffaf6] sm:mx-auto sm:my-[12vh] sm:h-[min(76vh,720px)] sm:max-w-5xl sm:rounded-[2rem] sm:shadow-2xl">
        <header className="flex items-center justify-between border-b border-orange-100 bg-white px-5 py-4 sm:rounded-t-[2rem] sm:px-8">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-700">Moorish Concierge</p><h2 className="mt-1 text-2xl font-black text-zinc-950">{text.title}</h2></div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-zinc-200 bg-white hover:border-orange-300 hover:text-orange-700" aria-label="Close"><X /></button>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <article className="mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-6 py-7 pb-5 sm:hidden">
            <p className="text-sm font-black uppercase tracking-[.16em] text-orange-700">{index + 1} / {plans.length} {text.count}</p>
            <div className="mt-4"><h3 className="text-3xl font-black text-zinc-950">{plan.title}</h3><strong className="mt-2 block text-2xl font-black text-orange-700">{plan.salePrice} {plan.currency}</strong></div>
            {plan.pricingUnit && <p className="mt-2 text-xs font-black uppercase tracking-wide text-zinc-400">{plan.pricingUnit.replaceAll("_", " ")}</p>}
            {plan.description && <p className="mt-6 whitespace-pre-line text-lg leading-8 text-zinc-600">{plan.description}</p>}
            {!!plan.options.length && <div className="mt-7"><h4 className="font-black text-zinc-950">{text.included}</h4><ul className="mt-3 grid gap-3">{plan.options.map((option) => <li key={option.id} className="flex gap-3 rounded-2xl bg-white p-4 font-semibold text-zinc-700 shadow-sm"><span className="text-green-600">✓</span>{option.title}</li>)}</ul></div>}
            <button type="button" onClick={() => onBook(plan.id)} className="mt-7 rounded-full bg-orange-600 px-7 py-4 text-lg font-black text-white shadow-lg transition hover:bg-orange-700">{text.book}</button>
          </article>

          {multiplePlans && <nav className="flex shrink-0 items-center justify-between border-t border-orange-100 bg-white px-5 py-3 sm:hidden" aria-label={text.title}><button type="button" disabled={index === 0} onClick={() => move(-1)} className="flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 font-bold disabled:opacity-25" aria-label={text.previous}><ChevronLeft /> {index}</button><span className="text-sm font-black text-zinc-500">{index + 1} / {plans.length}</span><button type="button" disabled={index === plans.length - 1} onClick={() => move(1)} className="flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 font-bold disabled:opacity-25" aria-label={text.next}>{index + 2} <ChevronRight /></button></nav>}

          <div ref={desktopScroller} className="no-scrollbar hidden h-full w-full snap-x snap-mandatory scroll-px-10 items-stretch gap-5 overflow-x-auto overflow-y-hidden py-6 sm:flex [&>article:first-child]:ml-10 [&>article:last-child]:mr-10 [&>article]:h-full [&>article>button]:mx-3 [&>article>button]:mt-auto [&>article>button]:inline-flex [&>article>button]:min-h-11 [&>article>button]:items-center [&>article>button]:justify-center [&>article>button]:py-0 [&>article>button]:text-center [&>article>button]:leading-none">
            {plans.map((item, itemIndex) => <article key={item.id} className="flex max-h-full w-[38%] min-w-[310px] shrink-0 snap-start flex-col overflow-y-auto rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[.16em] text-orange-700">{itemIndex + 1} / {plans.length}</p><div className="mt-3"><h3 className="text-xl font-black text-zinc-950">{item.title}</h3><strong className="mt-2 block text-xl font-black text-orange-700">{item.salePrice} {item.currency}</strong></div>{item.pricingUnit && <p className="mt-1 text-xs font-black uppercase tracking-wide text-zinc-400">{item.pricingUnit.replaceAll("_", " ")}</p>}{item.description && <p className="mt-4 whitespace-pre-line leading-6 text-zinc-600">{item.description}</p>}{!!item.options.length && <ul className="mt-4 grid gap-2">{item.options.map((option) => <li key={option.id} className="flex gap-2 text-sm font-semibold text-zinc-700"><span className="text-green-600">✓</span>{option.title}</li>)}</ul>}<button type="button" onClick={() => onBook(item.id)} className="mt-5 rounded-full bg-orange-600 px-5 py-3 font-black text-white transition hover:bg-orange-700">{text.book}</button></article>)}
          </div>

          {multiplePlans && <><button type="button" disabled={index === 0} onClick={() => move(-1)} className="nightclub-carousel-arrow absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-zinc-200 bg-white shadow-lg disabled:opacity-25 sm:grid" aria-label={text.previous}><ChevronLeft /></button><button type="button" disabled={index === plans.length - 1} onClick={() => move(1)} className="nightclub-carousel-arrow absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-zinc-200 bg-white shadow-lg disabled:opacity-25 sm:grid" aria-label={text.next}><ChevronRight /></button></>}
        </div>
      </div>
    </div>, document.body
  );
}
