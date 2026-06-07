import Link from "next/link";
import { categoryDescriptions, categoryLabels } from "@/lib/catalog";
import { Category } from "@/types/catalog";

const categories = Object.keys(categoryLabels) as Category[];

export default function ServicesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">Services</p>
      <h1 className="mt-3 max-w-4xl text-5xl font-black text-zinc-950">Everything guests need for a comfortable Marrakech stay.</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category} href={`/${category}`} className="rounded-3xl bg-white p-7 card-shadow transition hover:-translate-y-1">
            <p className="text-2xl font-black text-zinc-950">{categoryLabels[category]}</p>
            <p className="mt-3 leading-7 text-zinc-600">{categoryDescriptions[category]}</p>
            <p className="mt-5 font-black text-orange-700">View options →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
