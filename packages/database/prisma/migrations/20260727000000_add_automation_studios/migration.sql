CREATE TYPE "AutomationRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "FlowTrigger" AS ENUM ('CREATED', 'UPDATED');

CREATE TABLE "SenderEmail" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "replyTo" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedDate" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SenderEmail_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "defaultSubject" TEXT NOT NULL,
  "defaultHtml" TEXT NOT NULL,
  "languageBlocks" JSONB NOT NULL DEFAULT '{}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedDate" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AudienceAutomation" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sqlQuery" TEXT NOT NULL,
  "subscriberKeyField" TEXT NOT NULL,
  "emailField" TEXT NOT NULL,
  "languageField" TEXT,
  "senderEmailId" TEXT NOT NULL,
  "emailTemplateId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedDate" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AudienceAutomation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationRun" (
  "id" TEXT NOT NULL,
  "automationId" TEXT NOT NULL,
  "status" "AutomationRunStatus" NOT NULL DEFAULT 'RUNNING',
  "audienceCount" INTEGER NOT NULL DEFAULT 0,
  "deliveredCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "dryRun" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT,
  "startedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedDate" TIMESTAMP(3),
  "startedBy" TEXT,
  CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecordFlow" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sourceEntity" TEXT NOT NULL,
  "trigger" "FlowTrigger" NOT NULL,
  "condition" JSONB,
  "actions" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "lastRunDate" TIMESTAMP(3),
  "lastError" TEXT,
  "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedDate" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecordFlow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SenderEmail_email_key" ON "SenderEmail"("email");
CREATE INDEX "AudienceAutomation_senderEmailId_idx" ON "AudienceAutomation"("senderEmailId");
CREATE INDEX "AudienceAutomation_emailTemplateId_idx" ON "AudienceAutomation"("emailTemplateId");
CREATE INDEX "AutomationRun_automationId_startedDate_idx" ON "AutomationRun"("automationId", "startedDate");
CREATE INDEX "RecordFlow_sourceEntity_trigger_isActive_idx" ON "RecordFlow"("sourceEntity", "trigger", "isActive");

ALTER TABLE "AudienceAutomation" ADD CONSTRAINT "AudienceAutomation_senderEmailId_fkey" FOREIGN KEY ("senderEmailId") REFERENCES "SenderEmail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AudienceAutomation" ADD CONSTRAINT "AudienceAutomation_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "EmailTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "AudienceAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
