CREATE TYPE "TripCartStatus" AS ENUM ('ACTIVE', 'SUBMITTED', 'ABANDONED');

CREATE TABLE "TripCart" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "individualId" TEXT,
    "status" "TripCartStatus" NOT NULL DEFAULT 'ACTIVE',
    "email" TEXT,
    "contactRequestId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TripCart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripCartItem" (
    "id" TEXT NOT NULL,
    "tripCartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "plans" JSONB,
    "planId" TEXT,
    "planTitle" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TripCartItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TripCart_visitorId_status_idx" ON "TripCart"("visitorId", "status");
CREATE INDEX "TripCart_individualId_status_idx" ON "TripCart"("individualId", "status");
CREATE INDEX "TripCart_status_updatedDate_idx" ON "TripCart"("status", "updatedDate");
CREATE UNIQUE INDEX "TripCartItem_tripCartId_productId_key" ON "TripCartItem"("tripCartId", "productId");
CREATE INDEX "TripCartItem_tripCartId_idx" ON "TripCartItem"("tripCartId");
CREATE UNIQUE INDEX "TripCart_one_active_visitor_key" ON "TripCart"("visitorId") WHERE "status" = 'ACTIVE' AND "individualId" IS NULL;
CREATE UNIQUE INDEX "TripCart_one_active_individual_key" ON "TripCart"("individualId") WHERE "status" = 'ACTIVE' AND "individualId" IS NOT NULL;

ALTER TABLE "TripCart" ADD CONSTRAINT "TripCart_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripCartItem" ADD CONSTRAINT "TripCartItem_tripCartId_fkey" FOREIGN KEY ("tripCartId") REFERENCES "TripCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
