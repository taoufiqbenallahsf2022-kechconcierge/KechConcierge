import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { CatalogItem } from "@/types/catalog";
import { categoryLabels } from "@/lib/catalog";

export default function ItemCard({ item }: { item: CatalogItem }) {
  return (
    <Link href={`/${item.category}/${item.slug}`} className="group block min-w-[300px] max-w-[300px] overflow-hidden rounded-3xl bg-white card-shadow">
      <div className="relative h-56 overflow-hidden">
        <Image src={`${item.images[0]}?auto=format&fit=crop&w=900&q=80`} alt={item.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-orange-700">
          {categoryLabels[item.category]}
        </div>
        <div className="absolute bottom-4 right-4 rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-bold text-white">
          {item.images.length} photos
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-black text-zinc-950">{item.title}</h3>
        <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-zinc-500">
          <MapPin size={15} />
          {item.location}
        </p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">{item.shortDescription}</p>
        <div className="mt-4 flex items-center justify-between">
          <p className="font-black text-orange-700">{item.price}</p>
          <span className="text-sm font-bold text-zinc-950">Details →</span>
        </div>
      </div>
    </Link>
  );
}