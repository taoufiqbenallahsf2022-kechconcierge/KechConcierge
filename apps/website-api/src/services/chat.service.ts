import { prisma } from "../config/prisma";
import { generateAiChatResponse } from "./chat-ai.service";

type StartChatInput = {
  sessionId?: string;
  visitorId?: string;
  individualId?: string;
  leadId?: string;
  prospectId?: string;
  accountId?: string;
  language?: string;
};

type SendMessageInput = StartChatInput & {
  chatId?: string;
  message: string;
};

function resolveParticipantStage(input: StartChatInput) {
  if (input.accountId) return "ACCOUNT";
  if (input.prospectId) return "PROSPECT";
  if (input.leadId) return "LEAD";
  if (input.individualId) return "INDIVIDUAL";
  return "VISITOR";
}

function resolveSenderId(input: SendMessageInput) {
  return (
    input.individualId ||
    input.accountId ||
    input.prospectId ||
    input.leadId ||
    input.visitorId ||
    input.sessionId ||
    null
  );
}

export async function startChat(input: StartChatInput) {
  return prisma.chat.create({
    data: {
      sessionId: input.sessionId || null,
      visitorId: input.visitorId || null,
      individualId: input.individualId || null,
      leadId: input.leadId || null,
      prospectId: input.prospectId || null,
      accountId: input.accountId || null,
      participantStage: resolveParticipantStage(input) as any,
      managedBy: "AI" as any,
      status: "OPEN" as any,
    },
  });
}

async function findOpenChat(input: SendMessageInput) {
  if (input.chatId) {
    const chat = await prisma.chat.findUnique({
      where: {
        id: input.chatId,
      },
    });

    if (chat) return chat;
  }

  if (input.accountId) {
    const chat = await prisma.chat.findFirst({
      where: {
        accountId: input.accountId,
        status: "OPEN" as any,
      },
      orderBy: {
        createdDate: "desc",
      },
    });

    if (chat) return chat;
  }

  if (input.prospectId) {
    const chat = await prisma.chat.findFirst({
      where: {
        prospectId: input.prospectId,
        status: "OPEN" as any,
      },
      orderBy: {
        createdDate: "desc",
      },
    });

    if (chat) return chat;
  }

  if (input.leadId) {
    const chat = await prisma.chat.findFirst({
      where: {
        leadId: input.leadId,
        status: "OPEN" as any,
      },
      orderBy: {
        createdDate: "desc",
      },
    });

    if (chat) return chat;
  }

  if (input.individualId) {
    const chat = await prisma.chat.findFirst({
      where: {
        individualId: input.individualId,
        status: "OPEN" as any,
      },
      orderBy: {
        createdDate: "desc",
      },
    });

    if (chat) return chat;
  }

  if (input.sessionId) {
    const chat = await prisma.chat.findFirst({
      where: {
        sessionId: input.sessionId,
        status: "OPEN" as any,
      },
      orderBy: {
        createdDate: "desc",
      },
    });

    if (chat) return chat;
  }

  return null;
}

async function getOrCreateChat(input: SendMessageInput) {
  const existingChat = await findOpenChat(input);

  if (existingChat) return existingChat;

  return startChat(input);
}

export async function sendChatMessage(input: SendMessageInput) {
  if (!input.message || !input.message.trim()) {
    return {
      success: false,
      statusCode: 400,
      code: "ERROR_MESSAGE_REQUIRED",
      message: "Message is required.",
    };
  }

  const chat = await getOrCreateChat(input);

  const userMessage = await prisma.chatMessage.create({
    data: {
      chatId: chat.id,
      senderType: "VISITOR" as any,
      senderId: resolveSenderId(input),
      message: input.message.trim(),
    },
  });

  if (chat.managedBy !== "AI") {
    return {
      success: true,
      statusCode: 200,
      code: "CHAT_MESSAGE_STORED",
      chat,
      userMessage,
      aiMessage: null,
      reply: null,
      products: [],
      intent: null,
    };
  }

  const historyMessages = await prisma.chatMessage.findMany({
    where: {
      chatId: chat.id,
    },
    orderBy: {
      sendTime: "asc",
    },
    take: 20,
  });

  const history = historyMessages.map((message) => ({
    role:
      message.senderType === "VISITOR"
        ? ("user" as const)
        : ("assistant" as const),
    content: message.message,
  }));

  const aiResult = await generateAiChatResponse({
    message: input.message.trim(),
    language: input.language || "en",
    history,
  });

  const aiMessage = await prisma.chatMessage.create({
    data: {
      chatId: chat.id,
      senderType: "AI" as any,
      senderId: null,
      message: aiResult.reply,
    },
  });

  return {
    success: true,
    statusCode: 200,
    code: "CHAT_AI_RESPONSE_CREATED",
    chat,
    userMessage,
    aiMessage,
    reply: aiResult.reply,
    products: aiResult.products,
    intent: aiResult.intent,
  };
}

export async function getChatMessages(chatId: string) {
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
  });

  if (!chat) {
    return {
      success: false,
      statusCode: 404,
      code: "ERROR_CHAT_NOT_FOUND",
      message: "Chat not found.",
    };
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      chatId,
    },
    orderBy: {
      sendTime: "asc",
    },
  });

  return {
    success: true,
    statusCode: 200,
    code: "CHAT_MESSAGES_LOADED",
    chat,
    messages,
  };
}