import { Request, Response } from "express";
import {
  getChatMessages,
  sendChatMessage,
  startChat,
} from "../services/chat.service";

export async function startChatController(req: Request, res: Response) {
  try {
    const chat = await startChat({
      sessionId: req.body.sessionId,
      visitorId: req.body.visitorId,
      individualId: req.body.individualId,
      leadId: req.body.leadId,
      prospectId: req.body.prospectId,
      accountId: req.body.accountId,
      language: req.body.language,
    });

    return res.status(201).json({
      code: "CHAT_CREATED",
      chat,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      code: "ERROR_CHAT_CREATE_FAILED",
      message: "Unable to create chat.",
    });
  }
}

export async function sendChatMessageController(req: Request, res: Response) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        code: "ERROR_MESSAGE_REQUIRED",
        message: "Message is required.",
      });
    }

    const result = await sendChatMessage({
      chatId: req.body.chatId,
      sessionId: req.body.sessionId,
      visitorId: req.body.visitorId,
      individualId: req.body.individualId,
      leadId: req.body.leadId,
      prospectId: req.body.prospectId,
      accountId: req.body.accountId,
      language: req.body.language,
      message,
    });

    return res.status(200).json({
      code: "CHAT_MESSAGE_SENT",
      ...result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      code: "ERROR_CHAT_MESSAGE_FAILED",
      message: "Unable to send message.",
    });
  }
}

export async function getChatMessagesController(req: Request, res: Response) {
  try {
    const { chatId } = req.params;

    const messages = await getChatMessages(chatId);

    return res.status(200).json({
      code: "CHAT_MESSAGES_LOADED",
      messages,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      code: "ERROR_CHAT_MESSAGES_FAILED",
      message: "Unable to load chat messages.",
    });
  }
}