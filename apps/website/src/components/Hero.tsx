"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { getDictionary, getLocaleFromPath } from "@/lib/i18n";

type HeroSlide = {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  altText: string;
  durationMs?: number;
  transitionMs?: number;
  isActive?: boolean;
  order?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function localizePath(path: string, locale: string) {
  if (!path.startsWith("/") || locale === "en") return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

function fallbackSlides(t: ReturnType<typeof getDictionary>): HeroSlide[] {
  return [
    { id: "villa", mediaType: "IMAGE", mediaUrl: "https://images.unsplash.com/photo-1612600870196-5757968822bd?auto=format&fit=crop&q=88&w=2400", eyebrow: "Marrakech, Morocco", title: t.hero.title, description: t.categories.villasDescription, buttonLabel: t.hero.exploreVillas, buttonUrl: "/villas", altText: t.hero.imageAlt, durationMs: 7000, transitionMs: 1000 },
    { id: "nightlife", mediaType: "IMAGE", mediaUrl: "https://images.unsplash.com/photo-1744313930610-1649242d1fcd?auto=format&fit=crop&q=88&w=2400", eyebrow: "Beach clubs & nightlife", title: "Marrakech comes alive after dark.", description: "Poolside days, golden-hour music and unforgettable nights in Marrakech.", buttonLabel: "Explore nightlife", buttonUrl: "/nightclubs", altText: "Crowd dancing beneath colorful lights at a luxury nightclub", durationMs: 7000, transitionMs: 1000 },
    { id: "agafay", mediaType: "IMAGE", mediaUrl: "https://images.pexels.com/photos/29716310/pexels-photo-29716310.jpeg?auto=compress&cs=tinysrgb&w=2400", eyebrow: "Agafay nights", title: "Desert nights made unforgettable.", description: "Desert dinners, fire shows and open-sky celebrations beyond the city.", buttonLabel: "Explore experiences", buttonUrl: "/experiences", altText: "Fire dancer performing at a night celebration in the Agafay Desert", durationMs: 7000, transitionMs: 1000 },
  ];
}

export default function Hero() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [mediaReady, setMediaReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [settings, setSettings] = useState({ durationMs: 7000, transitionMs: 1000 });

  useEffect(() => {
    const controller = new AbortController();
    setSlides([]);
    setMediaReady(false);
    setActiveIndex(0);
    void fetch(`${API_URL}/api/website-configuration/hero?lang=${locale}`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load hero configuration")))
      .then((result) => {
        const configured = Array.isArray(result?.heroSlides) ? result.heroSlides.filter((slide: HeroSlide) => slide?.mediaUrl).slice(0, 5) : [];
        setSlides(configured.length ? configured : fallbackSlides(t));
        setSettings({ durationMs: Number(result?.settings?.durationMs) || 7000, transitionMs: Number(result?.settings?.transitionMs) || 1000 });
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          console.warn("Using fallback hero configuration", error);
          setSlides(fallbackSlides(t));
        }
      });
    return () => controller.abort();
  }, [locale]);

  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (!mediaReady || slides.length < 2) return;
    const duration = Math.min(60000, Math.max(1000, settings.durationMs));
    const timer = window.setTimeout(() => setActiveIndex((current) => (current + 1) % slides.length), duration);
    return () => window.clearTimeout(timer);
  }, [activeIndex, mediaReady, settings.durationMs, slides.length]);

  const previous = () => { if (slides.length) setActiveIndex((current) => (current - 1 + slides.length) % slides.length); };
  const next = () => { if (slides.length) setActiveIndex((current) => (current + 1) % slides.length); };
  const handleFirstMediaError = () => {
    if (slides[0]?.id === "villa") setMediaReady(true);
    else { setSlides(fallbackSlides(t)); setActiveIndex(0); setMediaReady(false); }
  };

  return <section
    className="relative isolate min-h-[680px] overflow-hidden bg-zinc-950 text-white sm:min-h-[740px] lg:min-h-[calc(100svh-86px)]"
    aria-roledescription="carousel" aria-label={t.hero.eyebrow}
    onKeyDown={(event) => { if (event.key === "ArrowLeft") previous(); if (event.key === "ArrowRight") next(); }}
  >
    <div className={`absolute inset-0 transition-opacity duration-700 ${mediaReady ? "opacity-100" : "opacity-0"}`}>
      {slides.map((slide, index) => <div key={slide.id} className={`absolute inset-0 ${index === activeIndex ? "opacity-100" : "opacity-0"}`} style={{ transitionProperty: "opacity", transitionDuration: `${Math.max(0, settings.transitionMs)}ms` }} aria-hidden={index !== activeIndex}>
        {slide.mediaType === "VIDEO" ? <video src={slide.mediaUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline preload={index === 0 ? "auto" : "metadata"} onLoadedData={index === 0 ? () => setMediaReady(true) : undefined} onError={index === 0 ? handleFirstMediaError : undefined} aria-label={slide.altText || slide.title} /> : <img src={slide.mediaUrl} alt={index === activeIndex ? slide.altText : ""} className={`h-full w-full object-cover transition-transform duration-[9000ms] ease-out ${index === activeIndex ? "scale-105" : "scale-100"}`} fetchPriority={index === 0 ? "high" : "auto"} onLoad={index === 0 ? () => setMediaReady(true) : undefined} onError={index === 0 ? handleFirstMediaError : undefined} />}
      </div>)}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,8,6,.84)_0%,rgba(12,8,6,.58)_43%,rgba(12,8,6,.14)_75%,rgba(12,8,6,.32)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,8,6,.62)_0%,transparent_43%,rgba(12,8,6,.14)_100%)]" />
    </div>

    <div className={`absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,#2b1b16_0%,#16100e_48%,#090706_100%)] transition-opacity duration-500 ${mediaReady ? "pointer-events-none opacity-0" : "opacity-100"}`} aria-hidden={mediaReady}>
      <div className="flex flex-col items-center gap-5">
        <img src="/brand/original-m-mark.png" alt="" className="h-20 w-20 object-contain opacity-90 sm:h-24 sm:w-24" />
        <span className="hero-reveal-line h-px w-20 origin-left bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
      </div>
    </div>

    {activeSlide && <div className={`relative mx-auto flex min-h-[680px] max-w-[1500px] flex-col justify-center px-5 py-24 transition-opacity duration-500 sm:min-h-[740px] sm:px-8 lg:min-h-[calc(100svh-86px)] xl:px-8 ${mediaReady ? "opacity-100" : "opacity-0"}`}>
      <div className="max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-100 backdrop-blur-md sm:text-sm"><Sparkles size={15} /> {activeSlide.eyebrow || t.hero.eyebrow}</div>
        <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-orange-300"><MapPin size={16} /> Marrakech <span className="h-px w-10 bg-orange-300/70" /> <span>{String(activeIndex + 1).padStart(2, "0")}</span></div>
        <h1 className="text-balance text-5xl font-black leading-[0.98] tracking-[-0.045em] drop-shadow-xl sm:text-6xl lg:text-7xl xl:text-[5.8rem]">{activeSlide.title}</h1>
        {activeSlide.description && <p className="mt-7 max-w-2xl border-l-2 border-orange-400 pl-5 text-base leading-7 text-white/85 sm:pl-6 sm:text-lg">{activeSlide.description}</p>}
        <div className="mt-9 flex flex-wrap gap-3">
          {activeSlide.buttonLabel && activeSlide.buttonUrl && <Link href={localizePath(activeSlide.buttonUrl, locale)} className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 font-black text-white shadow-[0_15px_40px_rgba(234,88,12,.3)] transition hover:-translate-y-0.5 hover:bg-orange-500">{activeSlide.buttonLabel}<ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></Link>}
          <Link href={localizePath("/contact", locale)} className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-7 py-4 font-black text-white backdrop-blur-md transition hover:border-white/70 hover:bg-white/20">{t.header.contact}</Link>
        </div>
      </div>
    </div>}

    {mediaReady && slides.length > 1 && <><button type="button" onClick={previous} className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/15 backdrop-blur-md transition hover:bg-black/35 sm:grid" aria-label="Previous slide"><ChevronLeft size={22} /></button><button type="button" onClick={next} className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/15 backdrop-blur-md transition hover:bg-black/35 sm:grid" aria-label="Next slide"><ChevronRight size={22} /></button></>}
  </section>;
}
