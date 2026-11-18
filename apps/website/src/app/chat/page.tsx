"use client";
import { interactionHeaders, trackInteraction } from "@/lib/interactions";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, History, MessageSquarePlus, Send, X } from "lucide-react";
import { CecileAvatar } from "@/components/chat/CecileAvatar";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPath, type Locale } from "@/lib/i18n";
import { useAuthStore } from "@/store/auth.store";
import { getVisitorId, getVisitorJourneyId } from "@/lib/visitor";
import { ChatMessageText } from "@/components/chat/ChatMessageText";
import { ChatProductRecommendations, type ChatProductRecommendation } from "@/components/chat/ChatProductRecommendations";

type ChatMessage = {
  id: string;
  senderType: string;
  message: string;
  sendTime: string;
  isRead: boolean;
  recommendations?: ChatProductRecommendation[] | null;
};

type Chat = {
  id: string;
  title: string;
  language: string;
  status: string;
  managedBy?: string;
  unread: boolean;
  advisorTyping: boolean;
  updatedDate: string;
  messages: ChatMessage[];
};

const copy: Record<Locale, Record<string, string>> = {
  en: { greeting: "Hi, I’m Cécile, your AI assistant at Moorish Concierge 😊 A dream villa, a night out or a Marrakech adventure? Tell me what you have in mind!", conversations: "Your conversations", assistant: "Your AI concierge", online: "Online Assistant", placeholder: "Write your message…", newChat: "New conversation", visitor: "Visitor", typing: "{name} is typing…", sent: "Sent", seen: "Seen", empty: "Your conversation with Cécile starts here." },
  fr: { greeting: "Bonjour, moi c’est Cécile, votre assistante IA chez Moorish Concierge 😊 Une villa de rêve, une sortie ou une escapade à Marrakech ? Dites-moi ce qui vous fait envie !", conversations: "Vos conversations", assistant: "Votre assistante IA", online: "Assistant en ligne", placeholder: "Écrivez votre message…", newChat: "Nouvelle conversation", visitor: "Visiteur", typing: "{name} écrit…", sent: "Envoyé", seen: "Vu", empty: "Votre conversation avec Cécile commence ici." },
  es: { greeting: "Hola, soy Cécile, tu asistente de IA en Moorish Concierge 😊 ¿Una villa de ensueño, una noche especial o una aventura en Marrakech? ¡Cuéntame qué te apetece!", conversations: "Tus conversaciones", assistant: "Tu concierge de IA", online: "Asistente en línea", placeholder: "Escribe tu mensaje…", newChat: "Nueva conversación", visitor: "Visitante", typing: "{name} está escribiendo…", sent: "Enviado", seen: "Visto", empty: "Tu conversación con Cécile empieza aquí." },
  pt: { greeting: "Olá, sou a Cécile, a sua assistente de IA na Moorish Concierge 😊 Uma villa de sonho, uma noite especial ou uma aventura em Marraquexe? Diga-me o que lhe apetece!", conversations: "As suas conversas", assistant: "A sua concierge IA", online: "Assistente online", placeholder: "Escreva a sua mensagem…", newChat: "Nova conversa", visitor: "Visitante", typing: "{name} está a escrever…", sent: "Enviado", seen: "Visto", empty: "A sua conversa com Cécile começa aqui." },
  it: { greeting: "Ciao, sono Cécile, la tua assistente IA di Moorish Concierge 😊 Una villa da sogno, una serata speciale o un’avventura a Marrakech? Raccontami cosa ti va!", conversations: "Le tue conversazioni", assistant: "La tua concierge IA", online: "Assistente online", placeholder: "Scrivi il tuo messaggio…", newChat: "Nuova conversazione", visitor: "Visitatore", typing: "{name} sta scrivendo…", sent: "Inviato", seen: "Visto", empty: "La tua conversazione con Cécile inizia qui." },
  de: { greeting: "Hallo, ich bin Cécile, Ihre KI-Assistentin bei Moorish Concierge 😊 Eine Traumvilla, ein besonderer Abend oder ein Abenteuer in Marrakesch? Erzählen Sie mir, worauf Sie Lust haben!", conversations: "Ihre Unterhaltungen", assistant: "Ihre KI-Concierge", online: "Online-Assistent", placeholder: "Schreiben Sie Ihre Nachricht…", newChat: "Neue Unterhaltung", visitor: "Besucher", typing: "{name} schreibt gerade…", sent: "Gesendet", seen: "Gesehen", empty: "Ihr Gespräch mit Cécile beginnt hier." },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function chatIdFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const chatIndex = segments.indexOf("chat");
  return chatIndex >= 0 ? segments[chatIndex + 1] ?? null : null;
}

export default function ChatPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPath(pathname);
  const t = copy[locale];
  const routeChatId = chatIdFromPath(pathname);
  const { accessToken, hasRestoredAuth, restoreAuth } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyDialog = useRef<HTMLDialogElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const typingSentAt = useRef(0);

  useEffect(() => {
    const sheet = historyDialog.current;
    if (historyOpen) sheet?.showModal();
    else sheet?.close();
  }, [historyOpen]);

  useEffect(() => {
    setHistoryOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeHistory = () => { if (desktop.matches) setHistoryOpen(false); };
    desktop.addEventListener("change", closeHistory);
    return () => desktop.removeEventListener("change", closeHistory);
  }, []);

  useEffect(() => {
    if (!hasRestoredAuth) restoreAuth();
  }, [hasRestoredAuth, restoreAuth]);

  const headers = useCallback(
    () => {
      const currentToken = useAuthStore.getState().accessToken;
      return {
        "Content-Type": "application/json",
        ...interactionHeaders(),
        "x-journey-id": getVisitorJourneyId(),
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      };
    },
    [accessToken],
  );

  const loadChats = useCallback(async () => {
    if (!hasRestoredAuth) return;
    const response = await fetch(`${API_URL}/api/chats`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to load conversations");
    const data = await response.json();
    setChats(data.chats);
  }, [hasRestoredAuth, headers]);

  const loadChat = useCallback(async () => {
    if (!routeChatId || !hasRestoredAuth) {
      setActiveChat(null);
      return;
    }
    const response = await fetch(`${API_URL}/api/chats/${routeChatId}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Conversation not found");
    const data = await response.json();
    setActiveChat(data.chat);
  }, [hasRestoredAuth, headers, routeChatId]);

  useEffect(() => {
    void loadChats().catch((reason) => setError(reason.message));
  }, [loadChats]);

  useEffect(() => {
    void loadChat().catch((reason) => setError(reason.message));
    if (!routeChatId) return;
    const interval = window.setInterval(() => {
      void Promise.all([loadChat(), loadChats()]);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [loadChat, loadChats, routeChatId]);

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [activeChat?.messages.length, activeChat?.advisorTyping]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--chat-viewport-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      requestAnimationFrame(() => {
        const container = messagesScrollRef.current;
        if (container) container.scrollTop = container.scrollHeight;
      });
    };
    updateHeight();
    viewport?.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);
    return () => {
      viewport?.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
      document.documentElement.style.removeProperty("--chat-viewport-height");
    };
  }, []);

  function localizedChatPath(id?: string) {
    const prefix = locale === "en" ? "" : `/${locale}`;
    return `${prefix}/chat${id ? `/${id}` : ""}`;
  }

  async function setTyping(typing: boolean) {
    if (!routeChatId) return;
    await fetch(`${API_URL}/api/chats/${routeChatId}/typing`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ typing }),
    });
  }

  async function sendMessage() {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    setMessage("");
    try {
      if (!routeChatId) {
        const response = await fetch(`${API_URL}/api/chats`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ message: text, language: locale }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? "Unable to start chat");
        setActiveChat(data.chat);
        await loadChats();
        router.replace(localizedChatPath(data.chat.id));
      } else {
        const response = await fetch(
          `${API_URL}/api/chats/${routeChatId}/messages`,
          {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ message: text }),
          },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? "Unable to send");
        await setTyping(false);
        await Promise.all([loadChat(), loadChats()]);
      }
    } catch (reason) {
      setMessage(text);
      setError(reason instanceof Error ? reason.message : "Unable to send");
    } finally {
      setSending(false);
    }
  }

  function onMessageChange(value: string) {
    setMessage(value);
    if (!routeChatId) return;
    if (!value.trim()) {
      void setTyping(false);
    } else if (Date.now() - typingSentAt.current > 2500) {
      typingSentAt.current = Date.now();
      void setTyping(true);
    }
  }

  const displayMessages: ChatMessage[] =
    activeChat?.messages?.length
      ? activeChat.messages
      : [{ id: "welcome", senderType: "AI", message: t.greeting, sendTime: new Date().toISOString(), isRead: true }];
  const activeTitle = !routeChatId ? "Cécile" : activeChat?.title ?? "Moorish Concierge";
  const closeLabel = { en: "Close conversations", fr: "Fermer les conversations", es: "Cerrar conversaciones", it: "Chiudi conversazioni", de: "Unterhaltungen schließen", pt: "Fechar conversas" }[locale];
  const historyLabel = { en: "Chats", fr: "Discussions", es: "Chats", it: "Chat", de: "Chats", pt: "Conversas" }[locale];
  const conversationNavigation = <>
    <div className="border-b border-orange-100 p-5">
      <h2 className="hidden text-xl font-black text-zinc-900 lg:block">Moorish Concierge</h2>
      <p className="mt-1 hidden text-sm text-zinc-500 lg:block">{t.conversations}</p>
      <button onClick={() => { setHistoryOpen(false); router.push(localizedChatPath()); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50 lg:mt-4">
        <MessageSquarePlus size={16} /> {t.newChat}
      </button>
    </div>
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
      {!chats.length && <p className="p-4 text-sm leading-6 text-zinc-400">{t.empty}</p>}
      {chats.map((chat) => (
        <button key={chat.id} onClick={() => { setHistoryOpen(false); router.push(localizedChatPath(chat.id)); }} aria-current={chat.id === routeChatId ? "page" : undefined} className={`w-full rounded-2xl p-4 text-left transition ${chat.id === routeChatId ? "bg-orange-50" : "hover:bg-zinc-50"}`}>
          <div className="flex items-center gap-3">
            {chat.managedBy === "AI" ? <CecileAvatar size={44} /> : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white"><Bot size={19} /></div>}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><p className={`truncate text-zinc-900 ${chat.unread ? "font-black" : "font-semibold"}`}>{chat.title}</p><time dateTime={chat.updatedDate} className="shrink-0 text-[11px] text-zinc-500">{new Date(chat.updatedDate).toLocaleDateString(locale, { month: "short", day: "numeric" })}</time></div>
              <p className={`truncate text-sm text-zinc-500 ${chat.unread ? "font-bold" : ""}`}>{chat.messages?.[0]?.message ?? t.assistant}</p>
            </div>
            {chat.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-orange-600" />}
          </div>
        </button>
      ))}
    </div>
  </>;

  return (
    <div className="fixed inset-x-0 top-0 h-[var(--chat-viewport-height,100dvh)] overflow-hidden overscroll-none bg-[#fffaf7]">
      <div className="flex h-full">
        <aside className="hidden w-[340px] border-r border-orange-100 bg-white lg:flex lg:flex-col">
          {conversationNavigation}
        </aside>

        <section data-track-component="chat" className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-orange-100 bg-white px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center gap-3">
              {!routeChatId || activeChat?.managedBy === "AI" ? <CecileAvatar /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white"><Bot size={20} /></div>}
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-black text-zinc-900">{activeTitle}</h1>
                <p className="text-sm text-zinc-500">{activeChat ? t.online : t.assistant}</p>
              </div>
              <button type="button" onClick={() => { void loadChats().catch((reason) => setError(reason.message)); setHistoryOpen(true); }} aria-label={t.conversations} aria-haspopup="dialog" aria-controls="mobile-chat-history" aria-expanded={historyOpen} className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-orange-100 px-3 text-xs font-semibold text-zinc-800 lg:hidden"><History size={19} /><span>{historyLabel}</span></button>
            </div>
          </div>

          <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:py-6">
            <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end gap-4">
              {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              {displayMessages.map((msg) => {
                const mine = ["VISITOR", "INDIVIDUAL", "LEAD", "PROSPECT", "ACCOUNT"].includes(msg.senderType);
                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`${!mine && msg.recommendations?.length ? "w-full min-w-0 max-w-[38rem] px-3 sm:px-4" : "max-w-[85%] px-5"} rounded-3xl py-3 shadow-sm ${mine ? "bg-orange-600 text-white" : "bg-white text-zinc-900"}`}>
                      <p className="whitespace-pre-wrap">{mine ? msg.message : <ChatMessageText message={msg.message} />}</p>
                      {!mine && msg.recommendations?.length ? <ChatProductRecommendations products={msg.recommendations} locale={locale} /> : null}
                      <div className={`mt-2 flex justify-end gap-2 text-xs ${mine ? "text-orange-100" : "text-zinc-400"}`}>
                        <span>{new Date(msg.sendTime).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span>
                        {mine && <span>{msg.isRead ? t.seen : t.sent}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeChat?.advisorTyping && <div className="chat-typing" role="status" aria-live="polite">
                <span className="chat-typing-dots" aria-hidden="true"><i /><i /><i /></span>
                <span>{t.typing.replace("{name}", activeTitle)}</span>
              </div>}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-orange-100 bg-white p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:p-4">
            <div data-track-form="chat" data-track-component="chat" className="mx-auto flex max-w-4xl items-end gap-3">
              <textarea data-track-field="message" value={message} onChange={(event) => onMessageChange(event.target.value)} placeholder={t.placeholder} rows={1} maxLength={5000} className="max-h-40 min-h-[52px] flex-1 resize-none rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-500" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} />
              <button onClick={() => void sendMessage()} disabled={sending || !message.trim()} aria-label={t.placeholder} className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-orange-600 text-white transition hover:bg-orange-700 disabled:opacity-50"><Send size={18} /></button>
            </div>
          </div>
        </section>
      </div>
      <dialog ref={historyDialog} id="mobile-chat-history" aria-label={t.conversations} onClose={() => setHistoryOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setHistoryOpen(false); }} className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-3xl border-0 bg-white p-0 pb-[env(safe-area-inset-bottom)] text-zinc-900 shadow-2xl backdrop:bg-black/45">
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-orange-100 px-5 py-2"><h2 className="font-bold">{t.conversations}</h2><button type="button" autoFocus aria-label={closeLabel} onClick={() => setHistoryOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600"><X size={20} /></button></div>
          {conversationNavigation}
        </div>
      </dialog>
    </div>
  );
}
