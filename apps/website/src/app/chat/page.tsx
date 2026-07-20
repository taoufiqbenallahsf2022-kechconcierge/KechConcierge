"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getLocaleFromPath } from "@/lib/i18n";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getOrCreateSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem("moorly_chat_session_id");

  if (existing) {
    return existing;
  }

  const created = `visitor_${crypto.randomUUID()}`;

  window.localStorage.setItem("moorly_chat_session_id", created);

  return created;
}

export default function ChatPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  const authUser = useAuthStore((state) => state.user);

  console.log('authUser',authUser);

  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const [chatId, setChatId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello 👋 Welcome to Moorly. How can we help you today?",
      createdAt: "10:00",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const currentMessage = message.trim();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: currentMessage,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          sessionId,
          language: locale,
          message: currentMessage,
          individualId: authUser?.id,
          /*leadId: authUser?.leadId,
          prospectId: authUser?.prospectId,
          accountId: authUser?.accountId,*/
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send message.");
      }

      if (data.chat?.id) {
        setChatId(data.chat.id);
      }

      const assistantMessage: Message = {
        id: data.aiMessage?.id || `assistant-${Date.now()}`,
        sender: "assistant",
        text: data.reply || data.aiMessage?.message || "I received your message.",
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: "assistant",
        text: "Sorry, I could not send your message. Please try again.",
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((current) => [...current, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-[#fffaf7]">
      <div className="flex h-full">
        <aside className="hidden w-[320px] border-r border-orange-100 bg-white lg:flex lg:flex-col">
          <div className="border-b border-orange-100 p-5">
            <h2 className="text-xl font-black text-zinc-900">Moorly</h2>

            <p className="mt-1 text-sm text-zinc-500">Your conversations</p>
          </div>

          <div className="p-4">
            <div className="cursor-pointer rounded-2xl bg-orange-50 p-4 transition hover:bg-orange-100">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white">
                  <Bot size={20} />
                </div>

                <div>
                  <p className="font-bold text-zinc-900">Moorly</p>

                  <p className="text-sm text-zinc-500">Concierge Assistant</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 text-xs text-zinc-400">
            Future admin mode will display all customer conversations here.
          </div>
        </aside>

        <section className="flex flex-1 flex-col">
          <div className="border-b border-orange-100 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white">
                <Bot size={20} />
              </div>

              <div>
                <h1 className="font-black text-zinc-900">Moorly</h1>

                <p className="text-sm text-zinc-500">Online Assistant</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-5 py-3 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-orange-600 text-white"
                        : "bg-white text-zinc-900"
                    }`}
                  >
                    {msg.sender === "assistant" ? (
                      <div
                        className="
                          prose
                          prose-sm
                          max-w-none

                          prose-p:my-2
                          prose-ul:my-2

                          prose-a:text-orange-600
                          prose-a:font-bold
                          prose-a:underline
                          prose-a:underline-offset-4
                          prose-a:decoration-2
                          prose-a:transition-colors
                          hover:prose-a:text-orange-700
                        "
                      >
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}

                    <div
                      className={`mt-2 text-xs ${
                        msg.sender === "user"
                          ? "text-orange-100"
                          : "text-zinc-400"
                      }`}
                    >
                      {msg.createdAt}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[85%] items-center gap-2 rounded-3xl bg-white px-5 py-3 text-zinc-500 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-orange-600" />
                    <span>Moorly is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-orange-100 bg-white p-4">
            <div className="mx-auto flex max-w-4xl items-end gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={1}
                className="max-h-40 min-h-[52px] flex-1 resize-none rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                disabled={loading || !message.trim()}
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-orange-600 text-white transition hover:bg-orange-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}