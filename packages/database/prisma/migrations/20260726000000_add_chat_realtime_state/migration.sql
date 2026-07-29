ALTER TYPE "ChatParticipantStage" ADD VALUE IF NOT EXISTS 'INDIVIDUAL';
ALTER TYPE "ChatSenderType" ADD VALUE IF NOT EXISTS 'INDIVIDUAL';

ALTER TABLE "Chat"
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN "endUserTypingUntil" TIMESTAMP(3),
ADD COLUMN "advisorTypingUntil" TIMESTAMP(3);

ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_chatId_fkey";
ALTER TABLE "ChatMessage"
ADD CONSTRAINT "ChatMessage_chatId_fkey"
FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Chat_visitorId_idx" ON "Chat"("visitorId");
CREATE INDEX "Chat_individualId_idx" ON "Chat"("individualId");
CREATE INDEX "Chat_advisorId_idx" ON "Chat"("advisorId");
CREATE INDEX "Chat_updatedDate_idx" ON "Chat"("updatedDate");
CREATE INDEX "ChatMessage_chatId_sendTime_idx" ON "ChatMessage"("chatId", "sendTime");
CREATE INDEX "ChatMessage_chatId_isRead_idx" ON "ChatMessage"("chatId", "isRead");
