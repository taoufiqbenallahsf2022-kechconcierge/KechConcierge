"use client";

import ProgressiveImage from "./ProgressiveImage";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useRef } from "react";

type GalleryImage = { url: string; alt: string };

export default function ProductImageLightbox({ images, selected, onSelect, onClose }: { images: GalleryImage[]; selected: number; onSelect: (index: number) => void; onClose: () => void }) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
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
      onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }}
      onTouchEnd={(event) => { const start = touchStart.current; touchStart.current = null; if (!start || images.length < 2) return; const touch = event.changedTouches[0]; const dx = touch.clientX - start.x; const dy = touch.clientY - start.y; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) { if (dx < 0) next(); else previous(); } }}
    ><ProgressiveImage key={active.url} src={active.url} alt={active.alt} fill priority sizes="100vw" className="select-none object-contain" draggable={false} />
      <div className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-black text-white shadow-lg backdrop-blur md:hidden"><Images size={15} aria-hidden="true" /><span>{selected + 1}/{images.length}</span></div>
      <button type="button" onClick={onClose} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur transition active:scale-95 md:hidden" aria-label="Close gallery"><X /></button>
      {images.length > 1 && <><button type="button" onClick={previous} className="nightclub-carousel-arrow absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-xl transition hover:scale-110 md:grid" aria-label="Previous image"><ChevronLeft /></button><button type="button" onClick={next} className="nightclub-carousel-arrow absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-xl transition hover:scale-110 md:grid" aria-label="Next image"><ChevronRight /></button></>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16 text-sm font-semibold text-white md:hidden"><p className="truncate">{active.alt}</p></div>
    </div>
    {images.length > 1 && <div className="no-scrollbar mx-auto mt-3 hidden max-w-full gap-2 overflow-x-auto md:flex">{images.map((image, index) => <button key={`${image.url}-${index}`} type="button" onClick={() => onSelect(index)} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${selected === index ? "border-orange-500" : "border-transparent opacity-60 hover:opacity-100"}`}><ProgressiveImage src={image.url} alt="" fill sizes="96px" className="object-cover" /></button>)}</div>}
  </div>;
}
