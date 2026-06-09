import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="orange-gradient">
      <div className="mx-auto grid min-h-[720px] max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-black text-orange-700">
            <Sparkles size={16} />
            Marrakech concierge services
          </div>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
            Your Marrakech stay, experiences, transport, and comfort in one place.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
            Moorly helps guests find villas, apartments, excursions, transportation, SPA experiences, restaurants, and local support in the Red City.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/villas" className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-4 font-black text-white transition hover:bg-orange-700">
              Explore villas
              <ArrowRight size={18} />
            </Link>
            <Link href="/services" className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-7 py-4 font-black text-zinc-950 transition hover:border-orange-300 hover:bg-orange-50">
              View services
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="relative h-[540px] overflow-hidden rounded-[2.5rem] card-shadow">
            <Image
              src="https://images.unsplash.com/photo-1597212720158-1f32ec48e6e8?auto=format&fit=crop&w=1200&q=80"
              alt="Marrakech luxury stay"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-8 left-6 rounded-3xl bg-white p-5 card-shadow">
            <p className="text-sm font-bold text-zinc-500">Starting from</p>
            <p className="text-3xl font-black text-orange-700">€55</p>
            <p className="text-sm font-semibold text-zinc-700">apartments, activities, and transfers</p>
          </div>
        </div>
      </div>
    </section>
  );
}
