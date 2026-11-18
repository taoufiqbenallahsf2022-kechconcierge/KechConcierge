"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { getLocaleFromPath } from "@/lib/i18n";
import { CHAT_INVITATION_DELAY_MS, CHAT_INVITATION_SESSION_KEY, chatInvitationKey, chatInvitationSeen, claimChatInvitation, invitationCopy, invitationTopic } from "@/lib/chat-invitation";
import { getVisitorId } from "@/lib/visitor";
import { CecileAvatar } from "./CecileAvatar";

export default function ChatInvitation() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const topic = invitationTopic(pathname);
  const t = invitationCopy[locale];
  const dialog = useRef<HTMLDialogElement>(null);
  const shown = useRef(false);

  useEffect(() => {
    const sheet = dialog.current;
    if (!sheet || !topic || shown.current) return;
    let visitorId: string;
    try {
      visitorId = getVisitorId();
      if (chatInvitationSeen(localStorage, visitorId)) return;
      // Preserve the old session cap for visitors who already saw the invitation.
      if (sessionStorage.getItem(CHAT_INVITATION_SESSION_KEY)) {
        claimChatInvitation(localStorage, visitorId);
        return;
      }
    } catch { return; }
    let sound: AudioContext | null = null;
    const started = Date.now();
    // A real gesture unlocks audio; blocked audio never blocks the invitation.
    const unlockSound = () => {
      if (sound?.state === "running") return;
      try {
        sound ??= new AudioContext();
        void sound.resume().catch(() => {});
      } catch { /* Audio is optional. */ }
    };
    const ring = () => {
      if (!sound || sound.state !== "running") return;
      const now = sound.currentTime;
      [740, 988].forEach((frequency, index) => {
        const tone = sound!.createOscillator();
        const gain = sound!.createGain();
        const start = now + index * 0.12;
        tone.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.035, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.19);
        tone.connect(gain); gain.connect(sound!.destination);
        tone.start(start); tone.stop(start + 0.2);
        tone.onended = () => { tone.disconnect(); gain.disconnect(); };
      });
    };
    window.addEventListener("click", unlockSound, { passive: true });
    window.addEventListener("keydown", unlockSound);
    const timer = window.setInterval(() => {
      if (shown.current || Date.now() - started < CHAT_INVITATION_DELAY_MS || document.visibilityState !== "visible") return;
      if (document.querySelector("dialog[open], [aria-modal='true'], [data-track-overlay], [data-track-component='floating-contact'][data-track-state='open']") || document.body.style.overflow === "hidden") return;
      if (document.activeElement?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (!claimChatInvitation(localStorage, visitorId)) {
        shown.current = true;
        window.clearInterval(timer);
        return;
      }
      sheet.showModal();
      shown.current = true;
      window.clearInterval(timer);
      window.removeEventListener("click", unlockSound);
      window.removeEventListener("keydown", unlockSound);
      try { ring(); } catch { /* Audio is optional on older mobile browsers too. */ }
    }, 1000);
    const onStored = (event: StorageEvent) => {
      if (event.key === chatInvitationKey(visitorId) && event.newValue) {
        shown.current = true;
        window.clearInterval(timer);
        sheet.close();
      }
    };
    window.addEventListener("storage", onStored);
    return () => {
      window.removeEventListener("storage", onStored);
      window.clearInterval(timer);
      window.removeEventListener("click", unlockSound);
      window.removeEventListener("keydown", unlockSound);
      sheet.close();
      if (sound && sound.state !== "closed") void sound.close().catch(() => {});
    };
  }, [pathname, topic]);

  if (!topic) return null;
  return (
    <dialog ref={dialog} aria-labelledby="cecile-invitation-title" aria-describedby="cecile-invitation-message" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none border-0 bg-transparent p-0 md:bottom-6 md:left-auto md:right-6 md:w-96 text-[#18181b] backdrop:bg-black/45">
      <div data-track-component="chat-invitation" className="relative w-full rounded-none border border-[#ffedd5] bg-[#ffffff] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl md:pb-5">
        <button autoFocus type="button" onClick={() => dialog.current?.close()} aria-label={t.close} className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-[#71717a] hover:bg-zinc-100"><X size={19} /></button>
        <div className="flex items-center gap-3 pr-9">
          <CecileAvatar size={56} />
          <div><h2 id="cecile-invitation-title" className="text-lg font-bold text-[#18181b]">Cécile <span aria-hidden="true">👋</span></h2><p className="text-xs text-[#71717a]">{t.assistant}</p></div>
        </div>
        <p id="cecile-invitation-message" className="mb-4 mt-4 text-[15px] leading-relaxed text-[#3f3f46]">{t.messages[topic]}</p>
        <Link data-track-target="open-chat" href={`${locale === "en" ? "" : `/${locale}`}/chat`} onClick={() => dialog.current?.close()} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700"><MessageCircle size={18} />{t.cta}</Link>
        <button type="button" onClick={() => dialog.current?.close()} className="mt-1 min-h-11 w-full text-sm text-[#71717a]">{t.later}</button>
      </div>
    </dialog>
  );
}
