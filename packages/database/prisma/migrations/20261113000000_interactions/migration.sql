ALTER TABLE "PageVisit" ADD COLUMN "clientPageInstanceId" TEXT;
CREATE INDEX "PageVisit_clientPageInstanceId_visitorId_journeyId_idx" ON "PageVisit"("clientPageInstanceId", "visitorId", "journeyId");

CREATE TABLE "Interaction" (
  "id" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "journeyId" TEXT NOT NULL,
  "individualId" TEXT,
  "sessionId" TEXT,
  "pageVisitId" TEXT,
  "pageInstanceId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "producer" TEXT NOT NULL DEFAULT 'BROWSER',
  "pageUrl" TEXT NOT NULL,
  "pageType" TEXT,
  "component" TEXT,
  "target" TEXT,
  "productId" TEXT,
  "productType" TEXT,
  "planId" TEXT,
  "imageIndex" INTEGER,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sequence" INTEGER,
  "elapsedMs" INTEGER,
  "durationMs" INTEGER,
  "inputType" TEXT,
  "authenticated" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  "deviceType" TEXT,
  "browser" TEXT,
  "operatingSystem" TEXT,
  "viewportWidth" INTEGER,
  "viewportHeight" INTEGER,
  "pointerCapability" TEXT,
  "hoverCapability" BOOLEAN,
  "language" TEXT,
  "theme" TEXT,
  "metadata" JSONB,
  CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Interaction_visitorId_occurredAt_idx" ON "Interaction"("visitorId", "occurredAt");
CREATE INDEX "Interaction_individualId_occurredAt_idx" ON "Interaction"("individualId", "occurredAt");
CREATE INDEX "Interaction_journeyId_pageInstanceId_sequence_idx" ON "Interaction"("journeyId", "pageInstanceId", "sequence");
CREATE INDEX "Interaction_pageVisitId_occurredAt_idx" ON "Interaction"("pageVisitId", "occurredAt");
CREATE INDEX "Interaction_eventType_receivedAt_idx" ON "Interaction"("eventType", "receivedAt");
CREATE INDEX "Interaction_productId_eventType_occurredAt_idx" ON "Interaction"("productId", "eventType", "occurredAt");
CREATE INDEX "Interaction_source_deviceType_receivedAt_idx" ON "Interaction"("source", "deviceType", "receivedAt");
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "VisitorJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_pageVisitId_fkey" FOREIGN KEY ("pageVisitId") REFERENCES "PageVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE OR REPLACE VIEW query_agent."Interaction" AS SELECT "id", "visitorId", "journeyId", "individualId", "sessionId", "pageVisitId", "pageInstanceId", "eventType", "producer", "pageUrl", "pageType", "component", "target", "productId", "productType", "planId", "imageIndex", "occurredAt", "receivedAt", "sequence", "elapsedMs", "durationMs", "inputType", "authenticated", "source", "deviceType", "browser", "operatingSystem", "viewportWidth", "viewportHeight", "pointerCapability", "hoverCapability", "language", "theme", "metadata" FROM public."Interaction";
CREATE OR REPLACE VIEW query_agent."PageVisit" AS SELECT "id", "pageUrl", "source", "pageName", "visitorId", "journeyId", "visitorStage", "leadId", "prospectId", "accountId", "individualId", "visitDate", "referrer", "userAgent", "ipAddress", "sessionId", "authenticationStatus", "accessOutcome", "previousPageUrl", "clickedLinkUrl", "navigationType", "clientVisitedAt", "browserLanguage", "webdriver", "requestOrigin", "fetchSite", "clientPageInstanceId" FROM public."PageVisit";
