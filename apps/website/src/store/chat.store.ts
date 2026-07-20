import { create } from "zustand";

export type ChatMessage = {
  id: string;
  chatId: string;
  senderType: "VISITOR" | "AI" | "ADVISOR" | string;
  message: string;
  createdAt: string;
};

export type ChatProduct = {
  id: string;
  uniqueCode: string;
  type: string;
  priceEuro: number;
  thumbnail: string;
  titleEN?: string;
  titleFR?: string;
  titleES?: string;
  titlePT?: string;
  titleIT?: string;
  titleDE?: string;
};

type ChatState = {
  chatId: string | null;
  messages: ChatMessage[];
  products: ChatProduct[];
  loading: boolean;
  error: string | null;

  sendMessage: (input: {
    message: string;
    language: string;
    sessionId: string;
    individualId?: string;
    leadId?: string;
    prospectId?: string;
    accountId?: string;
  }) => Promise<void>;

  resetChat: () => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const useChatStore = create<ChatState>((set, get) => ({
  chatId: null,
  messages: [],
  products: [],
  loading: false,
  error: null,

  sendMessage: async (input) => {
    const currentChatId = get().chatId;

    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      chatId: currentChatId || "pending",
      senderType: "VISITOR",
      message: input.message,
      createdAt: new Date().toISOString(),
    };

    set({
      loading: true,
      error: null,
      messages: [...get().messages, tempUserMessage],
    });

    try {
      const response = await fetch(`${API_URL}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: currentChatId,
          sessionId: input.sessionId,
          individualId: input.individualId,
          leadId: input.leadId,
          prospectId: input.prospectId,
          accountId: input.accountId,
          language: input.language,
          message: input.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.code || "Unable to send message.");
      }

      set({
        chatId: data.chat?.id || currentChatId,
        messages: [
          ...get().messages.filter((msg) => msg.id !== tempUserMessage.id),
          data.userMessage,
          data.aiMessage,
        ].filter(Boolean),
        products: data.products || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send message.",
      });
    }
  },

  resetChat: () => {
    set({
      chatId: null,
      messages: [],
      products: [],
      loading: false,
      error: null,
    });
  },
}));