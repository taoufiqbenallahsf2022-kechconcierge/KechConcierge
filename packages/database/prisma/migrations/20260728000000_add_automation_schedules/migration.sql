CREATE TYPE "AutomationScheduleType" AS ENUM ('MANUAL', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY');

ALTER TABLE "AudienceAutomation"
ADD COLUMN "scheduleType" "AutomationScheduleType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "scheduleMinute" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "scheduleHour" INTEGER,
ADD COLUMN "scheduleDayOfWeek" INTEGER,
ADD COLUMN "scheduleDayOfMonth" INTEGER,
ADD COLUMN "scheduleTimezone" TEXT NOT NULL DEFAULT 'Africa/Casablanca',
ADD COLUMN "nextRunAt" TIMESTAMP(3),
ADD COLUMN "lastRunAt" TIMESTAMP(3);

CREATE INDEX "AudienceAutomation_isActive_nextRunAt_idx"
ON "AudienceAutomation"("isActive", "nextRunAt");
