"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, UserRound } from "lucide-react";

type Message = {
  id: number;
  sender: "user" | "assistant";
  text: string;
  createdAt: string;
};

export default function ChatPage() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "assistant",
      text: "Hello 👋 Welcome to Kech Concierge. How can we help you today?",
      createdAt: "10:00",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: message,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((current) => [...current, userMessage]);

    const currentMessage = message;

    setMessage("");

    setTimeout(() => {
      const assistantMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: `Simulation reply: We received your request regarding "${currentMessage}". Later this message will come from AI or a real advisor.`,
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((current) => [...current, assistantMessage]);
    }, 1200);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#fffaf7]">
      <div className="flex h-full">
        {/* LEFT SIDEBAR */}

        <aside className="hidden w-[320px] border-r border-orange-100 bg-white lg:flex lg:flex-col">
          <div className="border-b border-orange-100 p-5">
            <h2 className="text-xl font-black text-zinc-900">
              Kech Concierge
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Your conversations
            </p>
          </div>

          <div className="p-4">
            <div className="cursor-pointer rounded-2xl bg-orange-50 p-4 transition hover:bg-orange-100">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white">
                  <Bot size={20} />
                </div>

                <div>
                  <p className="font-bold text-zinc-900">
                    Kech Concierge
                  </p>

                  <p className="text-sm text-zinc-500">
                    Concierge Assistant
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 text-xs text-zinc-400">
            Future admin mode will display all customer conversations here.
          </div>
        </aside>

        {/* CHAT AREA */}

        <section className="flex flex-1 flex-col">
          {/* CHAT HEADER */}

          <div className="border-b border-orange-100 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white">
                <Bot size={20} />
              </div>

              <div>
                <h1 className="font-black text-zinc-900">
                  Kech Concierge
                </h1>

                <p className="text-sm text-zinc-500">
                  Online Assistant
                </p>
              </div>
            </div>
          </div>

          {/* MESSAGES */}

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-5 py-3 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-orange-600 text-white"
                        : "bg-white text-zinc-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {msg.text}
                    </p>

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

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* INPUT BAR FIXED */}

          <div className="border-t border-orange-100 bg-white p-4">
            <div className="mx-auto flex max-w-4xl items-end gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={1}
                className="max-h-40 min-h-[52px] flex-1 resize-none rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-orange-500"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-orange-600 text-white transition hover:bg-orange-700"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}