import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdminAuth } from "../auth/middleware.js";
import { router as authRouter } from "./authRoutes.js";
import { router as individualsRouter } from "./entities/individualRoutes.js";
import { router as leadsRouter } from "./entities/leadRoutes.js";
import { router as prospectsRouter } from "./entities/prospectRoutes.js";
import { router as accountsRouter } from "./entities/accountRoutes.js";
import { router as productsRouter } from "./entities/productRoutes.js";
import { router as consentsRouter } from "./entities/consentRoutes.js";
import { router as usersRouter } from "./entities/userRoutes.js";
import { router as page_visitsRouter } from "./entities/pageVisitRoutes.js";
import { router as contact_requestsRouter } from "./entities/contactRequestRoutes.js";
import { router as chatsRouter } from "./entities/chatRoutes.js";
import { router as chat_messagesRouter } from "./entities/chatMessageRoutes.js";
import { router as whatsapp_conversationsRouter } from "./entities/whatsAppConversationRoutes.js";
import { router as whatsapp_messagesRouter } from "./entities/whatsAppMessageRoutes.js";
import { router as studioRouter } from "./studioRoutes.js";
export const api = Router();
api.get("/health", (_q, r) =>
  r.json({ status: "ok", service: "moorish-admin-api" }),
);
api.use("/auth", authRouter);
api.use(requireAdminAuth);
api.use("/studio", studioRouter);
api.post("/chats/:id/messages", async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim())
      return res.status(400).json({ message: "message is required" });
    const row = await prisma.chatMessage.create({
      data: {
        chatId: req.params.id,
        senderType: "ADVISOR",
        senderId: req.adminUser!.id,
        message,
      },
    });
    await prisma.chat.update({
      where: { id: req.params.id },
      data: {
        managedBy: "MANUAL",
        status: "WAITING_FOR_VISITOR",
        advisorId: req.adminUser!.id,
        advisorTypingUntil: null,
      },
    });
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});
api.post("/chats/:id/typing", async (req, res, next) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    await prisma.chat.update({
      where: { id: chat.id },
      data: {
        advisorTypingUntil:
          req.body?.typing === true ? new Date(Date.now() + 5000) : null,
      },
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
api.use("/individuals", individualsRouter);
api.use("/leads", leadsRouter);
api.use("/prospects", prospectsRouter);
api.use("/accounts", accountsRouter);
api.use("/products", productsRouter);
api.use("/consents", consentsRouter);
api.use("/users", usersRouter);
api.use("/page-visits", page_visitsRouter);
api.use("/contact-requests", contact_requestsRouter);
api.use("/chats", chatsRouter);
api.use("/chat-messages", chat_messagesRouter);
api.use("/whatsapp-conversations", whatsapp_conversationsRouter);
api.use("/whatsapp-messages", whatsapp_messagesRouter);
