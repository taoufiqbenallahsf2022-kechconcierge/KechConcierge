-- Nullable evidence fields: historical visits remain unknown.
ALTER TABLE "PageVisit" ADD COLUMN "authenticationStatus" TEXT;
ALTER TABLE "PageVisit" ADD COLUMN "accessOutcome" TEXT;
ALTER TABLE "PageVisit" ADD COLUMN "previousPageUrl" TEXT;
ALTER TABLE "PageVisit" ADD COLUMN "clickedLinkUrl" TEXT;
ALTER TABLE "PageVisit" ADD COLUMN "navigationType" TEXT;
ALTER TABLE "PageVisit" ADD COLUMN "clientVisitedAt" TIMESTAMP(3);
ALTER TABLE "PageVisit" ADD COLUMN "browserLanguage" TEXT;
ALTER TABLE "PageVisit" ADD COLUMN "webdriver" BOOLEAN;
ALTER TABLE "PageVisit" ADD COLUMN "requestOrigin" TEXT;
ALTER TABLE "PageVisit" ADD COLUMN "fetchSite" TEXT;

CREATE OR REPLACE VIEW query_agent."PageVisit" AS SELECT "id", "pageUrl", "source", "pageName", "visitorId", "journeyId", "visitorStage", "leadId", "prospectId", "accountId", "individualId", "visitDate", "referrer", "userAgent", "ipAddress", "sessionId", "authenticationStatus", "accessOutcome", "previousPageUrl", "clickedLinkUrl", "navigationType", "clientVisitedAt", "browserLanguage", "webdriver", "requestOrigin", "fetchSite" FROM public."PageVisit";
