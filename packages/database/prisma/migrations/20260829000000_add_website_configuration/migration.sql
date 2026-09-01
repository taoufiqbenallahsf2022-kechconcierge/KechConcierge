CREATE TABLE "WebsiteConfiguration" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "heroSlides" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "WebsiteConfiguration_pkey" PRIMARY KEY ("id")
);
