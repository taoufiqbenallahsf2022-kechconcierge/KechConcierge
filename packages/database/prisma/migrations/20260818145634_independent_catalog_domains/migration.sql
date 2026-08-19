-- CreateTable
CREATE TABLE "Villa" (
    "id" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "priceEuro" DECIMAL(12,2),
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
    "priceTitleFR" TEXT,
    "priceTitleEN" TEXT,
    "priceTitleDE" TEXT,
    "priceTitleIT" TEXT,
    "priceTitlePT" TEXT,
    "priceTitleES" TEXT,
    "descriptionFR" TEXT,
    "descriptionEN" TEXT,
    "descriptionDE" TEXT,
    "descriptionIT" TEXT,
    "descriptionPT" TEXT,
    "descriptionES" TEXT,
    "addressFR" TEXT,
    "addressEN" TEXT,
    "addressDE" TEXT,
    "addressIT" TEXT,
    "addressPT" TEXT,
    "addressES" TEXT,
    "tagsFR" JSONB,
    "tagsEN" JSONB,
    "tagsDE" JSONB,
    "tagsIT" JSONB,
    "tagsPT" JSONB,
    "tagsES" JSONB,
    "detailsFR" JSONB,
    "detailsEN" JSONB,
    "detailsDE" JSONB,
    "detailsIT" JSONB,
    "detailsPT" JSONB,
    "detailsES" JSONB,
    "imageAlts" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Villa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VillaImage" (
    "id" TEXT NOT NULL,
    "villaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "altFR" TEXT,
    "altEN" TEXT,
    "altDE" TEXT,
    "altIT" TEXT,
    "altPT" TEXT,
    "altES" TEXT,

    CONSTRAINT "VillaImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "priceEuro" DECIMAL(12,2),
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
    "priceTitleFR" TEXT,
    "priceTitleEN" TEXT,
    "priceTitleDE" TEXT,
    "priceTitleIT" TEXT,
    "priceTitlePT" TEXT,
    "priceTitleES" TEXT,
    "descriptionFR" TEXT,
    "descriptionEN" TEXT,
    "descriptionDE" TEXT,
    "descriptionIT" TEXT,
    "descriptionPT" TEXT,
    "descriptionES" TEXT,
    "addressFR" TEXT,
    "addressEN" TEXT,
    "addressDE" TEXT,
    "addressIT" TEXT,
    "addressPT" TEXT,
    "addressES" TEXT,
    "tagsFR" JSONB,
    "tagsEN" JSONB,
    "tagsDE" JSONB,
    "tagsIT" JSONB,
    "tagsPT" JSONB,
    "tagsES" JSONB,
    "detailsFR" JSONB,
    "detailsEN" JSONB,
    "detailsDE" JSONB,
    "detailsIT" JSONB,
    "detailsPT" JSONB,
    "detailsES" JSONB,
    "imageAlts" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantImage" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "altFR" TEXT,
    "altEN" TEXT,
    "altDE" TEXT,
    "altIT" TEXT,
    "altPT" TEXT,
    "altES" TEXT,

    CONSTRAINT "RestaurantImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeachClub" (
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

    CONSTRAINT "BeachClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeachClubImage" (
    "id" TEXT NOT NULL,
    "beachClubId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "altFR" TEXT,
    "altEN" TEXT,
    "altDE" TEXT,
    "altIT" TEXT,
    "altPT" TEXT,
    "altES" TEXT,

    CONSTRAINT "BeachClubImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeachClubPlan" (
    "id" TEXT NOT NULL,
    "beachClubId" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "internalCost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "pricingUnit" TEXT,
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

    CONSTRAINT "BeachClubPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeachClubPlanOption" (
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

    CONSTRAINT "BeachClubPlanOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
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

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityImage" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "altFR" TEXT,
    "altEN" TEXT,
    "altDE" TEXT,
    "altIT" TEXT,
    "altPT" TEXT,
    "altES" TEXT,

    CONSTRAINT "ActivityImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityPlan" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "internalCost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "pricingUnit" TEXT,
    "durationMinutes" INTEGER,
    "minimumGuests" INTEGER,
    "maximumGuests" INTEGER,
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

    CONSTRAINT "ActivityPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityPlanOption" (
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

    CONSTRAINT "ActivityPlanOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transportation" (
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

    CONSTRAINT "Transportation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportationImage" (
    "id" TEXT NOT NULL,
    "transportationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "altFR" TEXT,
    "altEN" TEXT,
    "altDE" TEXT,
    "altIT" TEXT,
    "altPT" TEXT,
    "altES" TEXT,

    CONSTRAINT "TransportationImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportationPlan" (
    "id" TEXT NOT NULL,
    "transportationId" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "serviceType" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "durationMinutes" INTEGER,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "internalCost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "pricingUnit" TEXT,
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

    CONSTRAINT "TransportationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportationPlanOption" (
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

    CONSTRAINT "TransportationPlanOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Villa_uniqueCode_key" ON "Villa"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "VillaImage_villaId_order_key" ON "VillaImage"("villaId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_uniqueCode_key" ON "Restaurant"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantImage_restaurantId_order_key" ON "RestaurantImage"("restaurantId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "BeachClub_uniqueCode_key" ON "BeachClub"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "BeachClubImage_beachClubId_order_key" ON "BeachClubImage"("beachClubId", "order");

-- CreateIndex
CREATE INDEX "BeachClubPlan_beachClubId_isActive_order_idx" ON "BeachClubPlan"("beachClubId", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "BeachClubPlan_beachClubId_uniqueCode_key" ON "BeachClubPlan"("beachClubId", "uniqueCode");

-- CreateIndex
CREATE INDEX "BeachClubPlanOption_planId_isActive_order_idx" ON "BeachClubPlanOption"("planId", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_uniqueCode_key" ON "Activity"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityImage_activityId_order_key" ON "ActivityImage"("activityId", "order");

-- CreateIndex
CREATE INDEX "ActivityPlan_activityId_isActive_order_idx" ON "ActivityPlan"("activityId", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityPlan_activityId_uniqueCode_key" ON "ActivityPlan"("activityId", "uniqueCode");

-- CreateIndex
CREATE INDEX "ActivityPlanOption_planId_isActive_order_idx" ON "ActivityPlanOption"("planId", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Transportation_uniqueCode_key" ON "Transportation"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "TransportationImage_transportationId_order_key" ON "TransportationImage"("transportationId", "order");

-- CreateIndex
CREATE INDEX "TransportationPlan_transportationId_isActive_order_idx" ON "TransportationPlan"("transportationId", "isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TransportationPlan_transportationId_uniqueCode_key" ON "TransportationPlan"("transportationId", "uniqueCode");

-- CreateIndex
CREATE INDEX "TransportationPlanOption_planId_isActive_order_idx" ON "TransportationPlanOption"("planId", "isActive", "order");

-- AddForeignKey
ALTER TABLE "VillaImage" ADD CONSTRAINT "VillaImage_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantImage" ADD CONSTRAINT "RestaurantImage_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeachClubImage" ADD CONSTRAINT "BeachClubImage_beachClubId_fkey" FOREIGN KEY ("beachClubId") REFERENCES "BeachClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeachClubPlan" ADD CONSTRAINT "BeachClubPlan_beachClubId_fkey" FOREIGN KEY ("beachClubId") REFERENCES "BeachClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeachClubPlanOption" ADD CONSTRAINT "BeachClubPlanOption_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BeachClubPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityImage" ADD CONSTRAINT "ActivityImage_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityPlan" ADD CONSTRAINT "ActivityPlan_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityPlanOption" ADD CONSTRAINT "ActivityPlanOption_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ActivityPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationImage" ADD CONSTRAINT "TransportationImage_transportationId_fkey" FOREIGN KEY ("transportationId") REFERENCES "Transportation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationPlan" ADD CONSTRAINT "TransportationPlan_transportationId_fkey" FOREIGN KEY ("transportationId") REFERENCES "Transportation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationPlanOption" ADD CONSTRAINT "TransportationPlanOption_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TransportationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
