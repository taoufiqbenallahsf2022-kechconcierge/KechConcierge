-- AlterTable
ALTER TABLE "Individual" ADD COLUMN     "acquisitionSource" TEXT;

-- AlterTable
ALTER TABLE "PageVisit" ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "lastSource" TEXT,
    "landingPage" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "language" TEXT,
    "deviceType" TEXT,
    "utmCampaign" TEXT,
    "utmMedium" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorIdentity" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "individualId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentQuery" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "sql" TEXT NOT NULL,
    "explanation" TEXT,
    "model" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentQueryExecution" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "executedBy" TEXT NOT NULL,
    "sql" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rowCount" INTEGER,
    "durationMs" INTEGER NOT NULL,
    "error" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentQueryExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visitor_source_firstSeenAt_idx" ON "Visitor"("source", "firstSeenAt");

-- CreateIndex
CREATE INDEX "Visitor_lastSeenAt_idx" ON "Visitor"("lastSeenAt");

-- CreateIndex
CREATE INDEX "Visitor_email_idx" ON "Visitor"("email");

-- CreateIndex
CREATE INDEX "VisitorIdentity_individualId_idx" ON "VisitorIdentity"("individualId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorIdentity_visitorId_individualId_key" ON "VisitorIdentity"("visitorId", "individualId");

-- CreateIndex
CREATE INDEX "AgentQuery_createdBy_updatedDate_idx" ON "AgentQuery"("createdBy", "updatedDate");

-- CreateIndex
CREATE INDEX "AgentQueryExecution_queryId_createdDate_idx" ON "AgentQueryExecution"("queryId", "createdDate");

-- CreateIndex
CREATE INDEX "PageVisit_visitorId_visitDate_idx" ON "PageVisit"("visitorId", "visitDate");

-- CreateIndex
CREATE INDEX "PageVisit_source_visitDate_idx" ON "PageVisit"("source", "visitDate");

-- AddForeignKey
ALTER TABLE "VisitorIdentity" ADD CONSTRAINT "VisitorIdentity_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorIdentity" ADD CONSTRAINT "VisitorIdentity_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentQueryExecution" ADD CONSTRAINT "AgentQueryExecution_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "AgentQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing anonymous history without inventing visitor personal data.
INSERT INTO "Visitor" ("id", "firstSeenAt", "lastSeenAt")
SELECT id, MIN(seen), MAX(seen) FROM (
 SELECT "visitorId" AS id, "visitDate" AS seen FROM "PageVisit" WHERE "visitorId" IS NOT NULL
 UNION ALL SELECT "visitorId", "createdDate" FROM "ContactRequest" WHERE "visitorId" IS NOT NULL
 UNION ALL SELECT "visitorId", "createdDate" FROM "Chat" WHERE "visitorId" IS NOT NULL
 UNION ALL SELECT "visitorId", "createdDate" FROM "TripCart"
 UNION ALL SELECT "visitorId", "startedAt" FROM "VisitorJourney"
) history GROUP BY id ON CONFLICT ("id") DO NOTHING;
UPDATE "PageVisit" SET source = LEFT(LOWER(substring("pageUrl" from '[?&](?:source|utm_source)=([^&#]+)')), 120)
WHERE "pageUrl" ~ '[?&](source|utm_source)=';
UPDATE "Visitor" v SET source = (
 SELECT p.source FROM "PageVisit" p WHERE p."visitorId" = v.id AND p.source IS NOT NULL ORDER BY p."visitDate" ASC LIMIT 1
), "lastSource" = (
 SELECT p.source FROM "PageVisit" p WHERE p."visitorId" = v.id AND p.source IS NOT NULL ORDER BY p."visitDate" DESC LIMIT 1
);
INSERT INTO "VisitorIdentity" (id, "visitorId", "individualId")
SELECT md5(h."visitorId" || ':' || h."individualId"), h."visitorId", h."individualId" FROM (
 SELECT "visitorId", "individualId" FROM "VisitorJourney" WHERE "individualId" IS NOT NULL
 UNION SELECT "visitorId", "individualId" FROM "PageVisit" WHERE "visitorId" IS NOT NULL AND "individualId" IS NOT NULL
 UNION SELECT "visitorId", "individualId" FROM "ContactRequest" WHERE "visitorId" IS NOT NULL AND "individualId" IS NOT NULL
 UNION SELECT "visitorId", "individualId" FROM "Chat" WHERE "visitorId" IS NOT NULL AND "individualId" IS NOT NULL
) h JOIN "Visitor" v ON v.id = h."visitorId" JOIN "Individual" i ON i.id = h."individualId"
ON CONFLICT ("visitorId", "individualId") DO NOTHING;
UPDATE "Individual" i SET "acquisitionSource" = (
 SELECT v.source FROM "VisitorIdentity" vi JOIN "Visitor" v ON v.id = vi."visitorId"
 WHERE vi."individualId" = i.id AND v.source IS NOT NULL ORDER BY v."firstSeenAt" ASC LIMIT 1
) WHERE "acquisitionSource" IS NULL;

-- Restricted reporting projections: authentication secrets and message bodies are excluded.
CREATE VIEW reporting_visitors AS SELECT id, "firstName" AS first_name, "lastName" AS last_name, email, phone, source, "lastSource" AS last_source, "landingPage" AS landing_page, referrer, language, "deviceType" AS device_type, "utmCampaign" AS utm_campaign, "utmMedium" AS utm_medium, "firstSeenAt" AS first_seen_at, "lastSeenAt" AS last_seen_at FROM "Visitor";
CREATE VIEW reporting_visitor_identities AS SELECT "visitorId" AS visitor_id, "individualId" AS individual_id, "linkedAt" AS linked_at FROM "VisitorIdentity";
CREATE VIEW reporting_individuals AS SELECT id, "firstName" AS first_name, "lastName" AS last_name, email, "manualEmail" AS manual_email, "mobilePhone" AS phone, country, language, source AS registration_source, "acquisitionSource" AS source, "createdDate" AS created_at FROM "Individual";
CREATE VIEW reporting_page_visits AS SELECT id, "visitorId" AS visitor_id, "individualId" AS individual_id, "journeyId" AS journey_id, "pageUrl" AS page_url, "pageName" AS page_name, "visitDate" AS visited_at, source, referrer, "sessionId" AS session_id FROM "PageVisit";
CREATE VIEW reporting_contact_requests AS SELECT id, "visitorId" AS visitor_id, "individualId" AS individual_id, "firstName" AS first_name, "lastName" AS last_name, email, "requestType" AS request_type, "createdDate" AS created_at FROM "ContactRequest";
CREATE VIEW reporting_chats AS SELECT id, "visitorId" AS visitor_id, "individualId" AS individual_id, "journeyId" AS journey_id, status, "managedBy" AS managed_by, language, "createdDate" AS created_at FROM "Chat";
CREATE VIEW reporting_customers AS SELECT id, "individualId" AS individual_id, source AS registration_source, "createdDate" AS created_at FROM "Account";
CREATE VIEW reporting_orders AS SELECT id, "individualId" AS individual_id, "contactRequestId" AS contact_request_id, status, "paymentStatus" AS payment_status, currency, "totalAmount" AS total_amount, "paidAmount" AS paid_amount, "createdDate" AS created_at FROM "ConciergeOrder";
