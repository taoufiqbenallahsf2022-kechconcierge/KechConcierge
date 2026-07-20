import { Router } from "express";
import {
  getChatMessagesController,
  sendChatMessageController,
  startChatController,
} from "../controllers/chat.controller";

const router = Router();

router.post("/start", startChatController);
router.post("/message", sendChatMessageController);
router.get("/:chatId/messages", getChatMessagesController);

export default router;