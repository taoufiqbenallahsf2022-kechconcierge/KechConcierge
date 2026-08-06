"use client";

import Image from "next/image";
import { CalendarDays, ChevronDown, Loader2, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { Locale } from "@/lib/i18n";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const countries = [
  { iso: "ma", region: "MA", code: "+212" }, { iso: "fr", region: "FR", code: "+33" },
  { iso: "es", region: "ES", code: "+34" }, { iso: "gb", region: "GB", code: "+44" },
  { iso: "pt", region: "PT", code: "+351" }, { iso: "it", region: "IT", code: "+39" },
  { iso: "de", region: "DE", code: "+49" }, { iso: "us", region: "US", code: "+1" },
  { iso: "ca", region: "CA", code: "+1" }, { iso: "be", region: "BE", code: "+32" },
  { iso: "ch", region: "CH", code: "+41" }, { iso: "nl", region: "NL", code: "+31" },
  { iso: "dz", region: "DZ", code: "+213" }, { iso: "tn", region: "TN", code: "+216" },
  { iso: "ae", region: "AE", code: "+971" }, { iso: "sa", region: "SA", code: "+966" },
] as const;

const copy = {
  en: { cta: "Book now", title: "Request this experience", intro: "Share your dates and contact details. Our concierge will get back to you shortly.", start: "Start date", end: "End date", first: "First name", last: "Last name", email: "Email address", phone: "Mobile number", send: "Send request", sending: "Sending…", success: "Your request has been sent. Our concierge will contact you shortly.", error: "Please complete every field with valid information.", message: (a: string, b: string, p: string) => `Product request for ${p}, from ${a} to ${b}.` },
  fr: { cta: "Faire une demande", title: "Demander cette expérience", intro: "Indiquez vos dates et coordonnées. Notre conciergerie vous répondra rapidement.", start: "Date de début", end: "Date de fin", first: "Prénom", last: "Nom", email: "Adresse e-mail", phone: "Téléphone mobile", send: "Envoyer la demande", sending: "Envoi…", success: "Votre demande a été envoyée. Notre conciergerie vous contactera rapidement.", error: "Veuillez renseigner correctement tous les champs.", message: (a: string, b: string, p: string) => `Demande concernant ${p}, du ${a} au ${b}.` },
  es: { cta: "Solicitar ahora", title: "Solicitar esta experiencia", intro: "Indica tus fechas y datos. Nuestro equipo de conserjería te responderá pronto.", start: "Fecha de inicio", end: "Fecha de fin", first: "Nombre", last: "Apellido", email: "Correo electrónico", phone: "Teléfono móvil", send: "Enviar solicitud", sending: "Enviando…", success: "Tu solicitud ha sido enviada.", error: "Completa correctamente todos los campos.", message: (a: string, b: string, p: string) => `Solicitud sobre ${p}, del ${a} al ${b}.` },
  pt: { cta: "Fazer pedido", title: "Solicitar esta experiência", intro: "Partilhe as datas e os contactos. A nossa equipa responderá em breve.", start: "Data de início", end: "Data de fim", first: "Nome", last: "Apelido", email: "E-mail", phone: "Telemóvel", send: "Enviar pedido", sending: "A enviar…", success: "O seu pedido foi enviado.", error: "Preencha corretamente todos os campos.", message: (a: string, b: string, p: string) => `Pedido sobre ${p}, de ${a} a ${b}.` },
  it: { cta: "Invia una richiesta", title: "Richiedi questa esperienza", intro: "Indica le date e i recapiti. Il nostro concierge ti risponderà presto.", start: "Data di inizio", end: "Data di fine", first: "Nome", last: "Cognome", email: "E-mail", phone: "Cellulare", send: "Invia richiesta", sending: "Invio…", success: "La richiesta è stata inviata.", error: "Compila correttamente tutti i campi.", message: (a: string, b: string, p: string) => `Richiesta per ${p}, dal ${a} al ${b}.` },
  de: { cta: "Anfrage senden", title: "Dieses Erlebnis anfragen", intro: "Teilen Sie uns Ihre Daten und Kontaktdaten mit. Unser Concierge meldet sich bald.", start: "Startdatum", end: "Enddatum", first: "Vorname", last: "Nachname", email: "E-Mail-Adresse", phone: "Mobilnummer", send: "Anfrage senden", sending: "Wird gesendet…", success: "Ihre Anfrage wurde gesendet.", error: "Bitte füllen Sie alle Felder korrekt aus.", message: (a: string, b: string, p: string) => `Produktanfrage für ${p}, vom ${a} bis ${b}.` },
} satisfies Record<Locale, unknown>;

type Props = { locale: Locale; productName: string; sticky: boolean };

export default function ProductBookingPanel({ locale, productName, sticky }: Props) {
  const text = copy[locale];
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [open, setOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({ startDate: "", endDate: "", firstName: "", lastName: "", email: "", countryCode: "+212", countryIso: "ma", phone: "" });
  const countryNames = useMemo(() => new Intl.DisplayNames([locale], { type: "region" }), [locale]);
  const selectedCountry = countries.find((item) => item.iso === form.countryIso) || countries[0];
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (user) setForm((current) => ({ ...current, firstName: current.firstName || user.firstName, lastName: current.lastName || user.lastName, email: current.email || user.email }));
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (status !== "idle") { setStatus("idle"); setFeedback(""); }
  }

  async function submit() {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!form.startDate || !form.endDate || form.endDate < form.startDate || !form.firstName.trim() || !form.lastName.trim() || !validEmail || !form.phone.trim()) {
      setStatus("error"); setFeedback(text.error); return;
    }
    setStatus("loading"); setFeedback("");
    try {
      const response = await fetch(`${API_URL}/api/contact-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({
          firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(),
          mobilePhone: `${form.countryCode}${form.phone.replace(/\s+/g, "").replace(/^0+/, "")}`,
          requestType: "PRODUCT_REQUEST", subject: productName, comment: text.message(form.startDate, form.endDate, productName), language: locale,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to send request.");
      setStatus("success"); setFeedback(text.success);
    } catch (error) {
      setStatus("error"); setFeedback(error instanceof Error ? error.message : text.error);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={sticky ? "group flex w-full items-center justify-center gap-3 bg-orange-600 px-6 py-4 text-lg font-black text-white shadow-[0_-10px_35px_rgba(234,88,12,.2)] transition hover:bg-orange-700" : "group mt-5 flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-orange-600 px-7 py-4 text-lg font-black text-white shadow-lg shadow-orange-600/20 transition duration-300 hover:-translate-y-1 hover:bg-orange-700 hover:shadow-xl"}>
        <CalendarDays className="transition group-hover:rotate-6 group-hover:scale-110" /> {text.cta}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[80] bg-zinc-950/75 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <aside className="ml-auto flex h-[100dvh] w-full animate-[booking-slide_.38s_cubic-bezier(.22,1,.36,1)] flex-col overflow-hidden bg-[#fffaf6] shadow-2xl lg:w-[min(620px,48vw)]">
            <div className="flex items-start justify-between border-b border-orange-100 bg-white px-6 py-5 sm:px-9 sm:py-7">
              <div><p className="text-xs font-black uppercase tracking-[.22em] text-orange-700">Moorish Concierge</p><h2 className="mt-2 text-3xl font-black text-zinc-950">{text.title}</h2><p className="mt-2 max-w-lg text-zinc-600">{text.intro}</p></div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white transition hover:rotate-90 hover:border-orange-300 hover:text-orange-700" aria-label="Close"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-9">
              <div className="rounded-2xl bg-orange-50 p-4 font-black text-orange-900">{productName}</div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-zinc-700">{text.start}<input type="date" min={today} value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-orange-500" /></label>
                <label className="grid gap-2 text-sm font-bold text-zinc-700">{text.end}<input type="date" min={form.startDate || today} value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-orange-500" /></label>
                <label className="grid gap-2 text-sm font-bold text-zinc-700">{text.first}<input autoComplete="given-name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-orange-500" /></label>
                <label className="grid gap-2 text-sm font-bold text-zinc-700">{text.last}<input autoComplete="family-name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-orange-500" /></label>
                <label className="grid gap-2 text-sm font-bold text-zinc-700 sm:col-span-2">{text.email}<input type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-orange-500" /></label>
                <div className="relative sm:col-span-2"><p className="mb-2 text-sm font-bold text-zinc-700">{text.phone}</p><div className="grid grid-cols-[145px_1fr] gap-2"><button type="button" onClick={() => setCountryOpen((value) => !value)} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-3"><span className="flex items-center gap-2"><Image unoptimized src={`https://flagcdn.com/w40/${selectedCountry.iso}.png`} alt="" width={24} height={16} className="h-4 w-6 object-cover" />{selectedCountry.code}</span><ChevronDown size={16} /></button><input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="min-w-0 rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-orange-500" /></div>
                  {countryOpen && <div className="absolute left-0 top-[82px] z-10 max-h-64 w-80 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">{countries.map((country) => <button key={`${country.iso}-${country.code}`} type="button" onClick={() => { setForm((current) => ({ ...current, countryIso: country.iso, countryCode: country.code })); setCountryOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-orange-50"><Image unoptimized src={`https://flagcdn.com/w40/${country.iso}.png`} alt="" width={24} height={16} className="h-4 w-6 object-cover" /><strong className="w-12">{country.code}</strong><span>{countryNames.of(country.region)}</span></button>)}</div>}
                </div>
              </div>
              {feedback && <div className={`mt-5 rounded-2xl px-4 py-3 font-bold ${status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{feedback}</div>}
              <button type="button" disabled={status === "loading" || status === "success"} onClick={submit} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-7 py-4 font-black text-white transition hover:bg-orange-700 disabled:opacity-60">{status === "loading" ? <Loader2 className="animate-spin" /> : <Send size={20} />}{status === "loading" ? text.sending : text.send}</button>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
