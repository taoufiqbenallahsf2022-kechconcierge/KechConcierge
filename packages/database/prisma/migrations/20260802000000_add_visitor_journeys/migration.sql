CREATE TABLE "VisitorJourney" (
  "id" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "individualId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VisitorJourney_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PageVisit" ADD COLUMN "journeyId" TEXT;
ALTER TABLE "Chat" ADD COLUMN "journeyId" TEXT;

CREATE INDEX "VisitorJourney_visitorId_idx" ON "VisitorJourney"("visitorId");
CREATE INDEX "VisitorJourney_individualId_idx" ON "VisitorJourney"("individualId");
CREATE INDEX "PageVisit_journeyId_idx" ON "PageVisit"("journeyId");
CREATE INDEX "Chat_journeyId_idx" ON "Chat"("journeyId");

ALTER TABLE "VisitorJourney" ADD CONSTRAINT "VisitorJourney_individualId_fkey"
FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_journeyId_fkey"
FOREIGN KEY ("journeyId") REFERENCES "VisitorJourney"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_journeyId_fkey"
FOREIGN KEY ("journeyId") REFERENCES "VisitorJourney"("id") ON DELETE SET NULL ON UPDATE CASCADE;
