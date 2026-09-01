"use client";

import Image from "next/image";
import { CalendarDays, Check, Loader2, Plus, Route, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n";
import { useTripStore, type TripPlan } from "@/store/trip.store";

const copy = {
  en: { add: "Add to trip", added: "Added to trip", title: "Add to your trip", intro: "Choose the plan and dates for this item before adding it.", plan: "Choose a plan", choose: "Select a plan…", start: "Start date", end: "End date", confirm: "Add to trip", saving: "Adding…", error: "Choose a plan and valid dates before adding this item." },
  fr: { add: "Ajouter au voyage", added: "Ajouté au voyage", title: "Ajouter à votre voyage", intro: "Choisissez la formule et les dates avant d’ajouter cet élément.", plan: "Choisir une formule", choose: "Sélectionner une formule…", start: "Date de début", end: "Date de fin", confirm: "Ajouter au voyage", saving: "Ajout…", error: "Choisissez une formule et des dates valides avant d’ajouter cet élément." },
  es: { add: "Añadir al viaje", added: "Añadido al viaje", title: "Añadir a tu viaje", intro: "Elige el plan y las fechas antes de añadir este elemento.", plan: "Elegir un plan", choose: "Seleccionar un plan…", start: "Fecha de inicio", end: "Fecha de fin", confirm: "Añadir al viaje", saving: "Añadiendo…", error: "Elige un plan y fechas válidas antes de añadir este elemento." },
  pt: { add: "Adicionar à viagem", added: "Adicionado à viagem", title: "Adicionar à sua viagem", intro: "Escolha o plano e as datas antes de adicionar este item.", plan: "Escolher um plano", choose: "Selecionar um plano…", start: "Data de início", end: "Data de fim", confirm: "Adicionar à viagem", saving: "A adicionar…", error: "Escolha um plano e datas válidas antes de adicionar este item." },
  it: { add: "Aggiungi al viaggio", added: "Aggiunto al viaggio", title: "Aggiungi al tuo viaggio", intro: "Scegli il piano e le date prima di aggiungere questo elemento.", plan: "Scegli un piano", choose: "Seleziona un piano…", start: "Data di inizio", end: "Data di fine", confirm: "Aggiungi al viaggio", saving: "Aggiunta…", error: "Scegli un piano e date valide prima di aggiungere questo elemento." },
  de: { add: "Zur Reise hinzufügen", added: "Zur Reise hinzugefügt", title: "Zur Reise hinzufügen", intro: "Wählen Sie Angebot und Termine, bevor Sie diesen Eintrag hinzufügen.", plan: "Angebot wählen", choose: "Angebot auswählen…", start: "Startdatum", end: "Enddatum", confirm: "Zur Reise hinzufügen", saving: "Wird hinzugefügt…", error: "Wählen Sie ein Angebot und gültige Termine." },
} satisfies Record<Locale, Record<string, string>>;

type Props = { locale: Locale; productId: string; productType: string; productName: string; category: string; image: string; plans?: TripPlan[]; selectedPlanId?: string };

export default function AddToTripButton({ locale, productId, productType, productName, category, image, plans = [], selectedPlanId }: Props) {
  const text = copy[locale];
  const add = useTripStore((state) => state.add);
  const existingItem = useTripStore((state) => state.items.find((item) => item.productId === productId));
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [planId, setPlanId] = useState(selectedPlanId || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const selectedPlan = plans.find((plan) => plan.id === planId);

  useEffect(() => { if (!open) return; const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, [open]);

  async function confirm() {
    if ((plans.length > 0 && !selectedPlan) || !startDate || !endDate || endDate < startDate) { setError(text.error); return; }
    setSaving(true); setError("");
    try {
      await add({ productId, productType, productName, category, image, plans, planId, planTitle: selectedPlan?.title, startDate, endDate });
      setOpen(false); setAdded(true); window.setTimeout(() => setAdded(false), 1800);
    } catch (cause) { setError(cause instanceof Error ? cause.message : text.error); }
    finally { setSaving(false); }
  }

  return <>
    <button type="button" onClick={() => { setPlanId(existingItem?.planId || selectedPlanId || ""); setStartDate(existingItem?.startDate || ""); setEndDate(existingItem?.endDate || ""); setError(""); setOpen(true); }} className="group mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-orange-600 bg-white px-7 py-3.5 font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50">
      {added ? <Check size={20} /> : <span className="relative"><Route size={20} /><Plus size={11} className="absolute -right-2 -top-1 rounded-full bg-orange-600 text-white" /></span>}{added ? text.added : text.add}
    </button>
    {open && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[90] bg-zinc-950/70 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <aside className="ml-auto flex h-[100dvh] w-full max-w-xl animate-[booking-slide_.38s_cubic-bezier(.22,1,.36,1)] flex-col bg-[#fffaf6] shadow-2xl">
        <header className="flex items-start justify-between border-b border-orange-100 bg-white px-6 py-6 sm:px-8"><div><p className="text-xs font-black uppercase tracking-[.22em] text-orange-700">Moorish Concierge</p><h2 className="mt-2 text-3xl font-black text-zinc-950">{text.title}</h2><p className="mt-2 text-zinc-600">{text.intro}</p></div><button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-zinc-200" aria-label="Close"><X /></button></header>
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="flex gap-4 rounded-3xl border border-orange-100 bg-white p-4"><div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#eee8e3]">{image && <Image src={image} alt="" fill sizes="112px" className="object-cover" />}</div><div className="min-w-0"><p className="text-xs font-black uppercase tracking-wider text-orange-700">{category}</p><h3 className="mt-1 text-xl font-black text-zinc-950">{productName}</h3></div></div>
          {plans.length > 0 && <label className="mt-6 grid gap-2 text-sm font-bold text-zinc-700">{text.plan}<select value={planId} onChange={(event) => { setPlanId(event.target.value); setError(""); }} className="h-13 rounded-2xl border border-zinc-200 bg-white px-4 py-3"><option value="">{text.choose}</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} — {plan.salePrice} {plan.currency}</option>)}</select></label>}
          <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2"><label className="grid min-w-0 gap-2 text-sm font-bold text-zinc-700">{text.start}<input type="date" min={today} value={startDate} onChange={(event) => { const value = event.target.value; setStartDate(value); if (endDate && endDate < value) setEndDate(""); setError(""); }} className="block h-[50px] w-full min-w-0 rounded-2xl border border-zinc-200 bg-white px-4" /></label><label className="grid min-w-0 gap-2 text-sm font-bold text-zinc-700">{text.end}<input type="date" min={startDate || today} value={endDate} onChange={(event) => { setEndDate(event.target.value); setError(""); }} className="block h-[50px] w-full min-w-0 rounded-2xl border border-zinc-200 bg-white px-4" /></label></div>
          {error && <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-700">{error}</p>}
          <button type="button" onClick={confirm} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-4 font-black text-white transition hover:bg-orange-700 disabled:opacity-60">{saving ? <Loader2 className="animate-spin" /> : <CalendarDays size={20} />}{saving ? text.saving : text.confirm}</button>
        </div>
      </aside>
    </div>, document.body)}
  </>;
}
