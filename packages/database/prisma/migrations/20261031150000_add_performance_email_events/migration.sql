CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "resendEmailId" TEXT NOT NULL,
    "messageId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "senderEmail" TEXT,
    "subject" TEXT,
    "category" TEXT,
    "lastEvent" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "lastEventAt" TIMESTAMP(3),
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "webhookEventId" TEXT NOT NULL,
    "resendEmailId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "link" TEXT,
    "bounceType" TEXT,
    "payload" JSONB,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailMessage_resendEmailId_key" ON "EmailMessage"("resendEmailId");
CREATE INDEX "EmailMessage_recipientEmail_sentAt_idx" ON "EmailMessage"("recipientEmail", "sentAt");
CREATE INDEX "EmailMessage_sentAt_idx" ON "EmailMessage"("sentAt");
CREATE INDEX "EmailMessage_lastEvent_sentAt_idx" ON "EmailMessage"("lastEvent", "sentAt");
CREATE UNIQUE INDEX "EmailEvent_webhookEventId_key" ON "EmailEvent"("webhookEventId");
CREATE INDEX "EmailEvent_type_occurredAt_idx" ON "EmailEvent"("type", "occurredAt");
CREATE INDEX "EmailEvent_recipientEmail_occurredAt_idx" ON "EmailEvent"("recipientEmail", "occurredAt");
CREATE INDEX "EmailEvent_resendEmailId_occurredAt_idx" ON "EmailEvent"("resendEmailId", "occurredAt");
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_resendEmailId_fkey" FOREIGN KEY ("resendEmailId") REFERENCES "EmailMessage"("resendEmailId") ON DELETE CASCADE ON UPDATE CASCADE;
