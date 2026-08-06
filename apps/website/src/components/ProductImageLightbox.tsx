"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

type GalleryImage = { url: string; alt: string };

export default function ProductImageLightbox({ images, selected, onSelect, onClose }: { images: GalleryImage[]; selected: number; onSelect: (index: number) => void; onClose: () => void }) {
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
  return <div className="fixed inset-0 z-[90] flex flex-col bg-zinc-950/95 p-3 backdrop-blur md:p-6">
    <div className="flex items-center justify-between text-white"><p className="max-w-[75vw] truncate text-sm font-bold">{active.alt}</p><div className="flex items-center gap-3"><span className="text-sm font-black">{selected + 1} / {images.length}</span><button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:rotate-90 hover:bg-white hover:text-zinc-950" aria-label="Close gallery"><X /></button></div></div>
    <div className="relative mt-3 flex-1 overflow-hidden rounded-2xl"><Image src={active.url} alt={active.alt} fill priority sizes="100vw" className="object-contain" />
      {images.length > 1 && <><button type="button" onClick={() => onSelect(selected === 0 ? images.length - 1 : selected - 1)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-xl transition hover:scale-110" aria-label="Previous image"><ChevronLeft /></button><button type="button" onClick={() => onSelect(selected === images.length - 1 ? 0 : selected + 1)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-xl transition hover:scale-110" aria-label="Next image"><ChevronRight /></button></>}
    </div>
    {images.length > 1 && <div className="no-scrollbar mx-auto mt-3 flex max-w-full gap-2 overflow-x-auto">{images.map((image, index) => <button key={`${image.url}-${index}`} type="button" onClick={() => onSelect(index)} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${selected === index ? "border-orange-500" : "border-transparent opacity-60 hover:opacity-100"}`}><Image src={image.url} alt="" fill sizes="96px" className="object-cover" /></button>)}</div>}
  </div>;
}
