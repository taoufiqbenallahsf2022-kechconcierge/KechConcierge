CREATE TABLE "ChatAgentTask" (
 "id" TEXT NOT NULL, "chatId" TEXT NOT NULL, "inputMessageId" TEXT NOT NULL, "responseMessageId" TEXT,
 "status" TEXT NOT NULL DEFAULT 'QUEUED', "attempts" INTEGER NOT NULL DEFAULT 0,
 "lockedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "lastError" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ChatAgentTask_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ChatAgentTask_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChatAgentTask_inputMessageId_key" ON "ChatAgentTask"("inputMessageId");
CREATE INDEX "ChatAgentTask_status_createdAt_idx" ON "ChatAgentTask"("status", "createdAt");
CREATE INDEX "ChatAgentTask_chatId_status_idx" ON "ChatAgentTask"("chatId", "status");
CREATE UNIQUE INDEX "ChatAgentTask_one_running_per_chat" ON "ChatAgentTask"("chatId") WHERE "status" = 'RUNNING';
CREATE TABLE "ChatAgentHandoff" (
 "id" TEXT NOT NULL, "chatId" TEXT NOT NULL, "contactRequestId" TEXT, "reason" TEXT NOT NULL,
 "recipient" TEXT NOT NULL, "emailBody" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'PENDING', "attempts" INTEGER NOT NULL DEFAULT 0,
 "lockedAt" TIMESTAMP(3), "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "sentAt" TIMESTAMP(3), "resendEmailId" TEXT, "lastError" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ChatAgentHandoff_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ChatAgentHandoff_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "ChatAgentHandoff_contactRequestId_fkey" FOREIGN KEY ("contactRequestId") REFERENCES "ContactRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChatAgentHandoff_chatId_key" ON "ChatAgentHandoff"("chatId");
CREATE UNIQUE INDEX "ChatAgentHandoff_contactRequestId_key" ON "ChatAgentHandoff"("contactRequestId");
CREATE INDEX "ChatAgentHandoff_status_nextAttemptAt_idx" ON "ChatAgentHandoff"("status", "nextAttemptAt");
