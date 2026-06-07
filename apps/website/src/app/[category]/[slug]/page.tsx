"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { categoryLabels, getItem, isCategory } from "@/lib/catalog";

export default function DetailsPage() {
  const params = useParams<{ category: string; slug: string }>();
  const category = params.category;
  const slug = params.slug;

  if (!isCategory(category)) notFound();

  const item = getItem(category, slug);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!item) notFound();

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <Link href={`/${category}`} className="font-black text-orange-700">← Back to {categoryLabels[category]}</Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="relative h-[520px] overflow-hidden rounded-[2rem] card-shadow">
            <Image src={`${item.images[selectedImage]}?auto=format&fit=crop&w=1400&q=80`} alt={item.title} fill className="object-cover" priority />
          </div>

          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-2">
            {item.images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                onClick={() => setSelectedImage(index)}
                className={`relative h-24 min-w-32 overflow-hidden rounded-2xl border-4 ${selectedImage === index ? "border-orange-600" : "border-transparent"}`}
              >
                <Image src={`${image}?auto=format&fit=crop&w=300&q=80`} alt={`${item.title} image ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">{categoryLabels[item.category]}</p>
          <h1 className="mt-3 text-5xl font-black text-zinc-950">{item.title}</h1>
          <p className="mt-3 text-lg font-bold text-zinc-500">{item.location}</p>
          <p className="mt-5 text-2xl font-black text-orange-700">{item.price}</p>
          <p className="mt-6 text-lg leading-8 text-zinc-700">{item.description}</p>

          <div className="mt-8">
            <p className="text-xl font-black text-zinc-950">Highlights</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {item.highlights.map((highlight) => (
                <span key={highlight} className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800">
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-white p-6 card-shadow">
            <p className="text-xl font-black text-zinc-950">Details</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {Object.entries(item.details).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm font-bold text-zinc-500">{key}</p>
                  <p className="font-black text-zinc-950">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="rounded-full bg-orange-600 px-7 py-4 text-center font-black text-white transition hover:bg-orange-700">
              Ask about this option
            </Link>
            <Link href="/chat" className="rounded-full bg-zinc-950 px-7 py-4 text-center font-black text-white transition hover:bg-orange-700">
              Open chat
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
