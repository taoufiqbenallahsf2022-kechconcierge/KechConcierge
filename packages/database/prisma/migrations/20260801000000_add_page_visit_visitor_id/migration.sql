ALTER TABLE "PageVisit" ADD COLUMN "visitorId" TEXT;
CREATE INDEX "PageVisit_visitorId_idx" ON "PageVisit"("visitorId");
CREATE INDEX "PageVisit_individualId_visitDate_idx" ON "PageVisit"("individualId", "visitDate");
