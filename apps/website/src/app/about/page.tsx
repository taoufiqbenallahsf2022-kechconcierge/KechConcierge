export default function AboutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">About us</p>
      <h1 className="mt-3 text-5xl font-black text-zinc-950">Kech Concierge is a Marrakech concierge service brand.</h1>
      <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-700">
        <p>
          Kech Concierge helps visitors discover comfortable stays and trusted services in Marrakech, from villas and apartments to excursions, transportation, SPA, and restaurants.
        </p>
        <p>
          This first version is frontend-only. It is ready to be connected later to your Node.js API, PostgreSQL database, authentication, and admin dashboard.
        </p>
        <p>
          The objective is simple: launch a beautiful first website quickly, then improve it step by step.
        </p>
      </div>
    </section>
  );
}
