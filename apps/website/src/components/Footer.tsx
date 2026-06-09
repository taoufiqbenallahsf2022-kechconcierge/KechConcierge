import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-2xl font-black">Moorly</p>
          <p className="mt-4 max-w-md text-zinc-400">
            First version website for Marrakech villas, apartments, activities, transport, SPA, restaurants, and concierge support.
          </p>
        </div>
        <div>
          <p className="font-black">Menu</p>
          <div className="mt-4 flex flex-col gap-2 text-zinc-400">
            <Link href="/services">Services</Link>
            <Link href="/villas">Villas</Link>
            <Link href="/apartments">Apartments</Link>
            <Link href="/chat">Chat</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="font-black">Contact</p>
          <div className="mt-4 text-zinc-400">
            <p>Marrakech, Morocco</p>
            <p>contact@kechconcierge.local</p>
            <p>+212 600 000 000</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Moorly. Demo frontend version.
      </div>
    </footer>
  );
}
