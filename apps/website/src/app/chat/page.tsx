"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, MessageSquarePlus, Send } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPath, type Locale } from "@/lib/i18n";
import { useAuthStore } from "@/store/auth.store";
import { getVisitorId, getVisitorJourneyId } from "@/lib/visitor";

type ChatMessage = {
  id: string;
  senderType: string;
  message: string;
  sendTime: string;
  isRead: boolean;
};

type Chat = {
  id: string;
  title: string;
  language: string;
  status: string;
  unread: boolean;
  advisorTyping: boolean;
  updatedDate: string;
  messages: ChatMessage[];
};

const copy: Record<Locale, Record<string, string>> = {
  en: { greeting: "Hello 👋 Welcome to Moorish Concierge. How can we help you today?", conversations: "Your conversations", assistant: "Concierge Assistant", online: "Online Assistant", placeholder: "Write your message…", newChat: "New conversation", visitor: "Visitor", typing: "Your advisor is typing…", sent: "Sent", seen: "Seen", empty: "Start a new conversation with our concierge team." },
  fr: { greeting: "Bonjour 👋 Bienvenue chez Moorish Concierge. Comment pouvons-nous vous aider aujourd’hui ?", conversations: "Vos conversations", assistant: "Assistant Concierge", online: "Assistant en ligne", placeholder: "Écrivez votre message…", newChat: "Nouvelle conversation", visitor: "Visiteur", typing: "Votre conseiller écrit…", sent: "Envoyé", seen: "Vu", empty: "Commencez une nouvelle conversation avec notre équipe de conciergerie." },
  es: { greeting: "Hola 👋 Bienvenido a Moorish Concierge. ¿Cómo podemos ayudarte hoy?", conversations: "Tus conversaciones", assistant: "Asistente de Concierge", online: "Asistente en línea", placeholder: "Escribe tu mensaje…", newChat: "Nueva conversación", visitor: "Visitante", typing: "Tu asesor está escribiendo…", sent: "Enviado", seen: "Visto", empty: "Inicia una nueva conversación con nuestro equipo de conserjería." },
  pt: { greeting: "Olá 👋 Bem-vindo ao Moorish Concierge. Como podemos ajudar hoje?", conversations: "As suas conversas", assistant: "Assistente de Concierge", online: "Assistente online", placeholder: "Escreva a sua mensagem…", newChat: "Nova conversa", visitor: "Visitante", typing: "O seu consultor está a escrever…", sent: "Enviado", seen: "Visto", empty: "Inicie uma nova conversa com a nossa equipa de concierge." },
  it: { greeting: "Ciao 👋 Benvenuto su Moorish Concierge. Come possiamo aiutarti oggi?", conversations: "Le tue conversazioni", assistant: "Assistente Concierge", online: "Assistente online", placeholder: "Scrivi il tuo messaggio…", newChat: "Nuova conversazione", visitor: "Visitatore", typing: "Il tuo consulente sta scrivendo…", sent: "Inviato", seen: "Visto", empty: "Inizia una nuova conversazione con il nostro team concierge." },
  de: { greeting: "Hallo 👋 Willkommen bei Moorish Concierge. Wie können wir Ihnen heute helfen?", conversations: "Ihre Unterhaltungen", assistant: "Concierge-Assistent", online: "Online-Assistent", placeholder: "Schreiben Sie Ihre Nachricht…", newChat: "Neue Unterhaltung", visitor: "Besucher", typing: "Ihr Berater schreibt gerade…", sent: "Gesendet", seen: "Gesehen", empty: "Starten Sie eine neue Unterhaltung mit unserem Concierge-Team." },
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const typingSentAt = useRef(0);

  useEffect(() => {
    if (!hasRestoredAuth) restoreAuth();
  }, [hasRestoredAuth, restoreAuth]);

  const headers = useCallback(
    () => {
      const currentToken = useAuthStore.getState().accessToken;
      return {
        "Content-Type": "application/json",
        "x-visitor-id": getVisitorId(),
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
  const activeTitle = activeChat?.title ?? "Moorish Concierge";

  return (
    <div className="fixed inset-x-0 top-0 h-[var(--chat-viewport-height,100dvh)] overflow-hidden overscroll-none bg-[#fffaf7]">
      <div className="flex h-full">
        <aside className="hidden w-[340px] border-r border-orange-100 bg-white lg:flex lg:flex-col">
          <div className="border-b border-orange-100 p-5">
            <h2 className="text-xl font-black text-zinc-900">Moorish Concierge</h2>
            <p className="mt-1 text-sm text-zinc-500">{t.conversations}</p>
            <button onClick={() => router.push(localizedChatPath())} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50">
              <MessageSquarePlus size={16} /> {t.newChat}
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {!chats.length && <p className="p-4 text-sm leading-6 text-zinc-400">{t.empty}</p>}
            {chats.map((chat) => (
              <button key={chat.id} onClick={() => router.push(localizedChatPath(chat.id))} className={`w-full rounded-2xl p-4 text-left transition ${chat.id === routeChatId ? "bg-orange-50" : "hover:bg-zinc-50"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white"><Bot size={19} /></div>
                  <div className="min-w-0">
                    <p className={`truncate text-zinc-900 ${chat.unread ? "font-black" : "font-semibold"}`}>{chat.title}</p>
                    <p className={`truncate text-sm text-zinc-500 ${chat.unread ? "font-bold" : ""}`}>{chat.messages?.[0]?.message ?? t.assistant}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-orange-100 bg-white px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white"><Bot size={20} /></div>
              <div>
                <h1 className="font-black text-zinc-900">{activeTitle}</h1>
                <p className="text-sm text-zinc-500">{activeChat ? t.online : t.assistant}</p>
              </div>
            </div>
          </div>

          <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:py-6">
            <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end gap-4">
              {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              {displayMessages.map((msg) => {
                const mine = ["VISITOR", "INDIVIDUAL", "LEAD", "PROSPECT", "ACCOUNT"].includes(msg.senderType);
                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-3xl px-5 py-3 shadow-sm ${mine ? "bg-orange-600 text-white" : "bg-white text-zinc-900"}`}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <div className={`mt-2 flex justify-end gap-2 text-xs ${mine ? "text-orange-100" : "text-zinc-400"}`}>
                        <span>{new Date(msg.sendTime).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span>
                        {mine && <span>{msg.isRead ? t.seen : t.sent}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeChat?.advisorTyping && <div className="text-sm italic text-zinc-400">{t.typing}</div>}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-orange-100 bg-white p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:p-4">
            <div className="mx-auto flex max-w-4xl items-end gap-3">
              <textarea value={message} onChange={(event) => onMessageChange(event.target.value)} placeholder={t.placeholder} rows={1} maxLength={5000} className="max-h-40 min-h-[52px] flex-1 resize-none rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-500" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} />
              <button onClick={() => void sendMessage()} disabled={sending || !message.trim()} aria-label={t.placeholder} className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-orange-600 text-white transition hover:bg-orange-700 disabled:opacity-50"><Send size={18} /></button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
