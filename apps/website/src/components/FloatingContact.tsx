"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, X, Send, Phone } from "lucide-react";

export default function FloatingContact() {
  const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  "+212 6 13 85 98 34";

  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-4 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white card-shadow">
          <div className="flex items-center justify-between bg-zinc-950 px-5 py-4 text-white">
            <div>
              <p className="font-black">Contact Moorish Concierge</p>
              <p className="text-xs text-zinc-300">Choose how you want to contact us</p>
            </div>
            <button onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="grid gap-3 p-4">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\s+/g, "")}`}
              target="_blank"
              className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-4 font-black text-green-700 transition hover:bg-green-100"
            >
              <Phone size={20} />
              WhatsApp
            </a>

            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl bg-orange-50 px-4 py-4 font-black text-orange-800 transition hover:bg-orange-100"
            >
              <Send size={20} />
              Contact form
            </Link>

            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl bg-zinc-950 px-4 py-4 font-black text-white transition hover:bg-orange-700"
            >
              <MessageCircle size={20} />
              Open chat
            </Link>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-2xl shadow-orange-500/30 transition hover:bg-orange-700"
        aria-label="Contact us"
      >
        {open ? <X /> : <MessageCircle />}
      </button>
    </div>
  );
}
