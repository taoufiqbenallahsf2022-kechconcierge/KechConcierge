"use client";

import Image from "next/image";
import { CalendarDays, CheckCircle2, Loader2, Map, Send, ShoppingBag, Trash2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { getLocaleFromPath, type Locale } from "@/lib/i18n";
import { getVisitorId } from "@/lib/visitor";
import { useAuthStore } from "@/store/auth.store";
import { useTripStore, type TripItem } from "@/store/trip.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const copy = {
  en: { trip: "My trip", title: "Build your trip", intro: "Combine several experiences and send one availability request.", empty: "Your trip is empty", emptyHint: "Add villas, transport and experiences as you browse.", dates: "Choose dates", start: "Start date", end: "End date", plan: "Plan", choose: "Choose a plan…", details: "Your contact details", first: "First name", last: "Last name", email: "Email address", phone: "Mobile number", send: "Check availability", sending: "Sending…", remove: "Remove", error: "Add valid dates for every item and complete your contact details.", success: "Your trip request has been sent. Our team will check availability and get back to you with a response." },
  fr: { trip: "Mon voyage", title: "Composez votre voyage", intro: "Combinez plusieurs expériences et envoyez une seule demande de disponibilité.", empty: "Votre voyage est vide", emptyHint: "Ajoutez des villas, transports et expériences pendant votre visite.", dates: "Choisir les dates", start: "Date de début", end: "Date de fin", plan: "Formule", choose: "Choisir une formule…", details: "Vos coordonnées", first: "Prénom", last: "Nom", email: "Adresse e-mail", phone: "Téléphone mobile", send: "Vérifier les disponibilités", sending: "Envoi…", remove: "Supprimer", error: "Ajoutez des dates valides pour chaque élément et complétez vos coordonnées.", success: "Votre demande de voyage a été envoyée. Notre équipe vérifiera les disponibilités et reviendra vers vous avec une réponse." },
  es: { trip: "Mi viaje", title: "Crea tu viaje", intro: "Combina varias experiencias y envía una sola solicitud de disponibilidad.", empty: "Tu viaje está vacío", emptyHint: "Añade villas, transporte y experiencias mientras navegas.", dates: "Elegir fechas", start: "Fecha de inicio", end: "Fecha de fin", plan: "Plan", choose: "Elegir un plan…", details: "Tus datos de contacto", first: "Nombre", last: "Apellido", email: "Correo electrónico", phone: "Teléfono móvil", send: "Consultar disponibilidad", sending: "Enviando…", remove: "Eliminar", error: "Añade fechas válidas para cada elemento y completa tus datos.", success: "Tu solicitud de viaje ha sido enviada. Nuestro equipo comprobará la disponibilidad y te responderá." },
  pt: { trip: "A minha viagem", title: "Crie a sua viagem", intro: "Combine várias experiências e envie um único pedido de disponibilidade.", empty: "A sua viagem está vazia", emptyHint: "Adicione villas, transporte e experiências enquanto navega.", dates: "Escolher datas", start: "Data de início", end: "Data de fim", plan: "Plano", choose: "Escolher um plano…", details: "Os seus contactos", first: "Nome", last: "Apelido", email: "E-mail", phone: "Telemóvel", send: "Verificar disponibilidade", sending: "A enviar…", remove: "Remover", error: "Adicione datas válidas a cada item e complete os seus contactos.", success: "O seu pedido de viagem foi enviado. A nossa equipa irá verificar a disponibilidade e responder-lhe." },
  it: { trip: "Il mio viaggio", title: "Crea il tuo viaggio", intro: "Combina più esperienze e invia un'unica richiesta di disponibilità.", empty: "Il tuo viaggio è vuoto", emptyHint: "Aggiungi ville, trasporti ed esperienze mentre navighi.", dates: "Scegli le date", start: "Data di inizio", end: "Data di fine", plan: "Piano", choose: "Scegli un piano…", details: "I tuoi contatti", first: "Nome", last: "Cognome", email: "E-mail", phone: "Cellulare", send: "Verifica disponibilità", sending: "Invio…", remove: "Rimuovi", error: "Aggiungi date valide per ogni elemento e completa i tuoi contatti.", success: "La richiesta di viaggio è stata inviata. Il nostro team verificherà la disponibilità e ti risponderà." },
  de: { trip: "Meine Reise", title: "Reise zusammenstellen", intro: "Kombinieren Sie mehrere Erlebnisse in einer Verfügbarkeitsanfrage.", empty: "Ihre Reise ist leer", emptyHint: "Fügen Sie Villen, Transfers und Erlebnisse hinzu.", dates: "Termine wählen", start: "Startdatum", end: "Enddatum", plan: "Angebot", choose: "Angebot wählen…", details: "Ihre Kontaktdaten", first: "Vorname", last: "Nachname", email: "E-Mail-Adresse", phone: "Mobilnummer", send: "Verfügbarkeit prüfen", sending: "Wird gesendet…", remove: "Entfernen", error: "Geben Sie für jeden Eintrag gültige Daten und Ihre Kontaktdaten ein.", success: "Ihre Reiseanfrage wurde gesendet. Unser Team prüft die Verfügbarkeit und meldet sich mit einer Antwort." },
} satisfies Record<Locale, Record<string, string>>;

export function TripHeaderButton() {
  const count = useTripStore((state) => state.items.length);
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPath(pathname);
  const tripPath = locale === "en" ? "/trip" : `/${locale}/trip`;
  return <button type="button" onClick={() => router.push(tripPath)} className="relative inline-grid h-[42px] w-[42px] place-items-center rounded-full border border-orange-100 bg-white/90 text-zinc-950 transition hover:border-orange-300 hover:text-orange-700" aria-label={`${copy[locale].trip} (${count})`} title={copy[locale].trip}>
    <ShoppingBag size={19} />
    {count > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-[10px] font-black text-white">{count}</span>}
  </button>;
}

export default function TripExperience({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const text = copy[locale];
  const { cart, items, isOpen, close, restore, update, remove, updateEmail, markSubmitted } = useTripStore();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [submittedItems, setSubmittedItems] = useState<TripItem[]>([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const submitted = cart?.status === "SUBMITTED" || status === "success";
  const visibleItems = status === "success" && submittedItems.length ? submittedItems : items;

  useEffect(() => { restore(); }, [restore]);
  useEffect(() => { const refresh = () => void restore(true); window.addEventListener("kech-auth-change", refresh); return () => window.removeEventListener("kech-auth-change", refresh); }, [restore]);
  useEffect(() => { if (user) setForm((current) => ({ firstName: current.firstName || user.firstName, lastName: current.lastName || user.lastName, email: current.email || user.email, phone: current.phone })); }, [user]);
  useEffect(() => { if (!(isOpen || embedded) || submitted || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return; const timer = window.setTimeout(() => void updateEmail(form.email.trim()), 700); return () => window.clearTimeout(timer); }, [form.email, isOpen, embedded, submitted, updateEmail]);
  useEffect(() => { if (!isOpen || embedded) return; const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, [isOpen, embedded]);
  useEffect(() => { if (cart?.status === "ACTIVE" && status === "success") { setStatus("idle"); setFeedback(""); } }, [cart?.id, cart?.status, status]);

  function change(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); if (status !== "idle") { setStatus("idle"); setFeedback(""); } }

  async function submit() {
    const datesValid = items.length > 0 && items.every((item) => item.startDate && item.endDate && item.endDate >= item.startDate && (!item.plans.length || item.planId));
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!datesValid || !form.firstName.trim() || !form.lastName.trim() || !emailValid || !form.phone.trim()) { setStatus("error"); setFeedback(text.error); return; }
    const lines = items.map((item, index) => {
      const plan = item.plans.find((entry) => entry.id === item.planId);
      return `${index + 1}. ${item.productName}${plan ? ` — ${plan.title} (${plan.salePrice} ${plan.currency})` : ""}\n   ${item.startDate} → ${item.endDate}`;
    });
    setStatus("loading"); setFeedback("");
    try {
      const response = await fetch(`${API_URL}/api/contact-requests`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "x-visitor-id": getVisitorId(), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), mobilePhone: form.phone.trim(), requestType: "PRODUCT_REQUEST", subject: `Trip availability request — ${items.length} item${items.length === 1 ? "" : "s"}`, comment: `Combined trip availability request:\n\n${lines.join("\n\n")}`, language: locale, tripItems: items.map((item) => { const plan = item.plans.find((entry) => entry.id === item.planId); return { productName: item.productName, category: item.category, image: item.image, planTitle: plan?.title || item.planTitle || null, planPrice: plan ? `${plan.salePrice} ${plan.currency}` : null, startDate: item.startDate, endDate: item.endDate }; }) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || text.error);
      const submittedSnapshot = items.map((item) => ({ ...item, plans: [...item.plans] }));
      await markSubmitted(data.contactRequest.id, form.email.trim()); setSubmittedItems(submittedSnapshot); setStatus("success"); setFeedback(text.success);
    } catch (error) { setStatus("error"); setFeedback(error instanceof Error ? error.message : text.error); }
  }

  if ((!isOpen && !embedded) || typeof document === "undefined") return null;
  const panel = <aside className={embedded ? "mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-orange-100 bg-[#fffaf6] shadow-sm" : "ml-auto flex h-[100dvh] w-full max-w-2xl animate-[booking-slide_.38s_cubic-bezier(.22,1,.36,1)] flex-col bg-[#fffaf6] shadow-2xl"}>
      <header className="flex items-start justify-between border-b border-orange-100 bg-white px-5 py-5 sm:px-8"><div><p className="text-xs font-black uppercase tracking-[.22em] text-orange-700">Moorish Concierge</p><h1 className="mt-1 text-3xl font-black text-zinc-950">{text.title}</h1><p className="mt-1 text-zinc-600">{text.intro}</p></div>{!embedded && <button type="button" onClick={close} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-zinc-200" aria-label="Close"><X /></button>}</header>
      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8">
        {!visibleItems.length && status !== "success" ? <div className="grid min-h-[55vh] place-items-center text-center"><div><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-orange-50 text-orange-700"><Map size={36} /></span><h3 className="mt-5 text-2xl font-black text-zinc-950">{text.empty}</h3><p className="mx-auto mt-2 max-w-sm text-zinc-500">{text.emptyHint}</p></div></div> : <>
          <div className="grid gap-4">{visibleItems.map((item) => <article key={item.id} className={`overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm ${submitted ? "pointer-events-none" : ""}`}>
            <div className="flex gap-4 p-4"><div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#eee8e3]">{item.image && <Image src={item.image} alt="" fill sizes="96px" className="object-cover" />}</div><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-wider text-orange-700">{item.category}</p><h3 className="truncate text-lg font-black text-zinc-950">{item.productName}</h3>{!submitted && <button type="button" onClick={() => remove(item.id)} className="mt-2 flex items-center gap-1 text-xs font-bold text-red-600"><Trash2 size={14} />{text.remove}</button>}</div></div>
            <div className="border-t border-zinc-100 p-4"><p className="mb-3 flex items-center gap-2 text-sm font-black text-zinc-700"><CalendarDays size={17} />{text.dates}</p>{item.plans.length > 0 && <label className="mb-3 grid gap-1 text-xs font-bold text-zinc-600">{text.plan}<select value={item.planId} onChange={(event) => update(item.id, { planId: event.target.value })} className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm"><option value="">{text.choose}</option>{item.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} — {plan.salePrice} {plan.currency}</option>)}</select></label>}<div className="grid min-w-0 gap-3 sm:grid-cols-2"><label className="grid min-w-0 gap-1 text-xs font-bold text-zinc-600">{text.start}<input type="date" min={today} value={item.startDate} onChange={(event) => update(item.id, { startDate: event.target.value, ...(item.endDate && item.endDate < event.target.value ? { endDate: "" } : {}) })} className="block h-12 w-full min-w-0 rounded-xl border border-zinc-200 px-3" /></label><label className="grid min-w-0 gap-1 text-xs font-bold text-zinc-600">{text.end}<input type="date" min={item.startDate || today} value={item.endDate} onChange={(event) => update(item.id, { endDate: event.target.value })} className="block h-12 w-full min-w-0 rounded-xl border border-zinc-200 px-3" /></label></div></div>
          </article>)}</div>
          {visibleItems.length > 0 && !submitted && <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-zinc-950">{text.details}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><input aria-label={text.first} placeholder={text.first} value={form.firstName} onChange={(e) => change("firstName", e.target.value)} className="h-12 rounded-xl border border-zinc-200 px-4" /><input aria-label={text.last} placeholder={text.last} value={form.lastName} onChange={(e) => change("lastName", e.target.value)} className="h-12 rounded-xl border border-zinc-200 px-4" /><input type="email" aria-label={text.email} placeholder={text.email} value={form.email} onChange={(e) => change("email", e.target.value)} className="h-12 rounded-xl border border-zinc-200 px-4 sm:col-span-2" /><input type="tel" aria-label={text.phone} placeholder={text.phone} value={form.phone} onChange={(e) => change("phone", e.target.value)} className="h-12 rounded-xl border border-zinc-200 px-4 sm:col-span-2" /></div></section>}
          {feedback && <div className={`mt-5 flex items-start gap-2 rounded-2xl px-4 py-3 font-bold ${status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{status === "success" && <CheckCircle2 className="shrink-0" />}{feedback}</div>}
          {visibleItems.length > 0 && !submitted && <button type="button" onClick={submit} disabled={status === "loading"} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-4 font-black text-white transition hover:bg-orange-700 disabled:opacity-60">{status === "loading" ? <Loader2 className="animate-spin" /> : <Send size={19} />}{status === "loading" ? text.sending : text.send}</button>}
        </>}
      </div>
    </aside>;
  if (embedded) return <main className="mx-auto w-full max-w-[1280px] px-5 py-10 sm:py-14">{panel}</main>;
  return createPortal(<div className="fixed inset-0 z-[90] bg-zinc-950/70 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>{panel}</div>, document.body);
}
