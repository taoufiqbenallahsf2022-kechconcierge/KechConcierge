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
    <div className={`fixed z-50 ${open ? "inset-0 sm:inset-auto sm:bottom-5 sm:right-5" : "bottom-5 right-5"}`}>
      {open && (
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white sm:mb-4 sm:h-auto sm:w-[min(340px,calc(100vw-2rem))] sm:rounded-3xl sm:card-shadow">
          <div className="flex items-center justify-between bg-zinc-950 px-5 py-4 text-white">
            <div>
              <p className="font-black">Contact Moorish Concierge</p>
              <p className="text-xs text-zinc-300">Choose how you want to contact us</p>
            </div>
            <button onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="grid flex-1 content-center gap-4 p-6 sm:block sm:flex-none sm:space-y-3 sm:p-4">
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
        className={`flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-2xl shadow-orange-500/30 transition hover:bg-orange-700 ${open ? "fixed bottom-5 right-5 sm:static" : ""}`}
        aria-label="Contact us"
      >
        {open ? <X /> : <MessageCircle />}
      </button>
    </div>
  );
}
