import Hero from "@/components/Hero";
import HorizontalSection from "@/components/HorizontalSection";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Curated stays", "Villas and apartments selected for comfort, location, and guest experience."],
            ["Local experiences", "Activities, transport, SPA, restaurants, and custom services around Marrakech."],
            ["Easy contact", "WhatsApp, contact form, or a dedicated chat page ready to connect later."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl bg-white p-7 card-shadow">
              <p className="text-xl font-black text-zinc-950">{title}</p>
              <p className="mt-3 leading-7 text-zinc-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <HorizontalSection category="villas" />
      <HorizontalSection category="apartments" />
      <HorizontalSection category="activities" />
      <HorizontalSection category="transportation" />
      <HorizontalSection category="spa" />
      <HorizontalSection category="restaurants" />

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-[2rem] bg-zinc-950 p-8 text-white md:p-12">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-400">Need a custom stay?</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black">Tell us your dates, group size, and preferred experience.</h2>
          <p className="mt-4 max-w-2xl text-zinc-300">
            This first version is frontend-only. Later, messages and bookings will be connected to your API and admin system.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="inline-block rounded-full bg-orange-600 px-7 py-4 text-center font-black text-white transition hover:bg-orange-700">
              Contact form
            </Link>
            <Link href="/chat" className="inline-block rounded-full bg-white px-7 py-4 text-center font-black text-zinc-950 transition hover:bg-orange-50">
              Open chat
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
