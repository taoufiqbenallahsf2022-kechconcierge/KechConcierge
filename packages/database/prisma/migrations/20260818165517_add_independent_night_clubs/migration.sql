-- CreateEnum
CREATE TYPE "NightClubPricingUnit" AS ENUM ('PER_PERSON', 'PER_TABLE', 'FIXED');

-- AlterTable
ALTER TABLE "RecordFlowVersion" ALTER COLUMN "updatedDate" DROP DEFAULT;

-- CreateTable
CREATE TABLE "NightClub" (
    "id" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "order" INTEGER,
    "thumbnail" TEXT NOT NULL,
    "titleFR" TEXT,
    "titleEN" TEXT,
    "titleDE" TEXT,
    "titleIT" TEXT,
    "titlePT" TEXT,
    "titleES" TEXT,
    "subtitleFR" TEXT,
    "subtitleEN" TEXT,
    "subtitleDE" TEXT,
    "subtitleIT" TEXT,
    "subtitlePT" TEXT,
    "subtitleES" TEXT,
    "descriptionFR" TEXT,
    "descriptionEN" TEXT,
    "descriptionDE" TEXT,
    "descriptionIT" TEXT,
    "descriptionPT" TEXT,
    "descriptionES" TEXT,
    "locationFR" TEXT,
    "locationEN" TEXT,
    "locationDE" TEXT,
    "locationIT" TEXT,
    "locationPT" TEXT,
    "locationES" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NightClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NightClubImage" (
    "id" TEXT NOT NULL,
    "nightClubId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "altFR" TEXT,
    "altEN" TEXT,
    "altDE" TEXT,
    "altIT" TEXT,
    "altPT" TEXT,
    "altES" TEXT,

    CONSTRAINT "NightClubImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NightClubPlan" (
    "id" TEXT NOT NULL,
    "nightClubId" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "internalCost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "pricingUnit" "NightClubPricingUnit",
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "titleFR" TEXT,
    "titleEN" TEXT,
    "titleDE" TEXT,
    "titleIT" TEXT,
    "titlePT" TEXT,
    "titleES" TEXT,
    "descriptionFR" TEXT,
    "descriptionEN" TEXT,
    "descriptionDE" TEXT,
    "descriptionIT" TEXT,
    "descriptionPT" TEXT,
    "descriptionES" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NightClubPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NightClubPlanOption" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "titleFR" TEXT,
    "titleEN" TEXT,
    "titleDE" TEXT,
    "titleIT" TEXT,
    "titlePT" TEXT,
    "titleES" TEXT,

    CONSTRAINT "NightClubPlanOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NightClub_uniqueCode_key" ON "NightClub"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "NightClubImage_nightClubId_order_key" ON "NightClubImage"("nightClubId", "order");

-- CreateIndex
CREATE INDEX "NightClubPlan_nightClubId_isActive_order_idx" ON "NightClubPlan"("nightClubId", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "NightClubPlan_nightClubId_uniqueCode_key" ON "NightClubPlan"("nightClubId", "uniqueCode");

-- CreateIndex
CREATE INDEX "NightClubPlanOption_planId_isActive_order_idx" ON "NightClubPlanOption"("planId", "isActive", "order");

-- AddForeignKey
ALTER TABLE "NightClubImage" ADD CONSTRAINT "NightClubImage_nightClubId_fkey" FOREIGN KEY ("nightClubId") REFERENCES "NightClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NightClubPlan" ADD CONSTRAINT "NightClubPlan_nightClubId_fkey" FOREIGN KEY ("nightClubId") REFERENCES "NightClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NightClubPlanOption" ADD CONSTRAINT "NightClubPlanOption_planId_fkey" FOREIGN KEY ("planId") REFERENCES "NightClubPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
