"use client";

import ProgressiveImage from "./ProgressiveImage";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useRef } from "react";

type GalleryImage = { url: string; alt: string };

export default function ProductImageLightbox({ images, selected, onSelect, onClose }: { images: GalleryImage[]; selected: number; onSelect: (index: number) => void; onClose: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el && Math.abs(el.scrollLeft - selected * el.clientWidth) > el.clientWidth * 0.55) el.scrollTo({ left: selected * el.clientWidth, behavior: "smooth" });
  }, [selected]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onSelect(selected === 0 ? images.length - 1 : selected - 1);
      if (event.key === "ArrowRight") onSelect(selected === images.length - 1 ? 0 : selected + 1);
    };
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", keydown); };
  }, [images.length, onClose, onSelect, selected]);

  const active = images[selected];
  if (!active) return null;
  const previous = () => onSelect(selected === 0 ? images.length - 1 : selected - 1);
  const next = () => onSelect(selected === images.length - 1 ? 0 : selected + 1);
  return <div className="fixed inset-0 z-[90] flex flex-col bg-zinc-950 backdrop-blur md:bg-zinc-950/95 md:p-6">
    <div className="hidden items-center justify-between text-white md:flex"><p className="max-w-[75vw] truncate text-sm font-bold">{active.alt}</p><div className="flex items-center gap-3"><span className="text-sm font-black">{selected + 1} / {images.length}</span><button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:rotate-90 hover:bg-white hover:text-zinc-950" aria-label="Close gallery"><X /></button></div></div>
    <div
      className="relative flex-1 overflow-hidden md:mt-3 md:rounded-2xl"
    >
      <div ref={scroller} className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain" onScroll={(event) => { const el = event.currentTarget; const index = Math.round(el.scrollLeft / el.clientWidth); if (index !== selected && index >= 0 && index < images.length) onSelect(index); }}>
        {images.map((image, index) => <div key={`${image.url}-${index}`} className="relative h-full w-full shrink-0 snap-center"><ProgressiveImage src={image.url} alt={image.alt} fill priority={index === selected} sizes="100vw" className="select-none object-contain" draggable={false} /></div>)}
      </div>
      <div className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-black text-white shadow-lg backdrop-blur md:hidden"><Images size={15} aria-hidden="true" /><span>{selected + 1}/{images.length}</span></div>
      <button type="button" onClick={onClose} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur transition active:scale-95 md:hidden" aria-label="Close gallery"><X /></button>
      {images.length > 1 && <><button type="button" onClick={previous} className="nightclub-carousel-arrow absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-xl transition hover:scale-110 md:grid" aria-label="Previous image"><ChevronLeft /></button><button type="button" onClick={next} className="nightclub-carousel-arrow absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-xl transition hover:scale-110 md:grid" aria-label="Next image"><ChevronRight /></button></>}
    </div>
    {images.length > 1 && <div className="no-scrollbar mx-auto mt-3 hidden max-w-full gap-2 overflow-x-auto md:flex">{images.map((image, index) => <button key={`${image.url}-${index}`} type="button" onClick={() => onSelect(index)} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${selected === index ? "border-orange-500" : "border-transparent opacity-60 hover:opacity-100"}`}><ProgressiveImage src={image.url} alt="" fill sizes="96px" className="object-cover" /></button>)}</div>}
  </div>;
}
