ALTER TABLE "ContactRequest" ADD COLUMN "visitorId" TEXT;
CREATE INDEX "ContactRequest_visitorId_idx" ON "ContactRequest"("visitorId");
