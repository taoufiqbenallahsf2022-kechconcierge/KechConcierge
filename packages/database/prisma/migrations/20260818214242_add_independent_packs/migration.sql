-- CreateEnum
CREATE TYPE "PackPricingUnit" AS ENUM ('PER_PERSON', 'PER_GROUP', 'PER_VEHICLE', 'PER_HOUR', 'HALF_DAY', 'FULL_DAY', 'FIXED');

-- CreateTable
CREATE TABLE "Pack" (
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

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackImage" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "altFR" TEXT,
    "altEN" TEXT,
    "altDE" TEXT,
    "altIT" TEXT,
    "altPT" TEXT,
    "altES" TEXT,

    CONSTRAINT "PackImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackPlan" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "serviceType" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "durationMinutes" INTEGER,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "internalCost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "pricingUnit" "PackPricingUnit",
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

    CONSTRAINT "PackPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackPlanOption" (
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

    CONSTRAINT "PackPlanOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pack_uniqueCode_key" ON "Pack"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "PackImage_packId_order_key" ON "PackImage"("packId", "order");

-- CreateIndex
CREATE INDEX "PackPlan_packId_isActive_order_idx" ON "PackPlan"("packId", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PackPlan_packId_uniqueCode_key" ON "PackPlan"("packId", "uniqueCode");

-- CreateIndex
CREATE INDEX "PackPlanOption_planId_isActive_order_idx" ON "PackPlanOption"("planId", "isActive", "order");

-- AddForeignKey
ALTER TABLE "PackImage" ADD CONSTRAINT "PackImage_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackPlan" ADD CONSTRAINT "PackPlan_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackPlanOption" ADD CONSTRAINT "PackPlanOption_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PackPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
