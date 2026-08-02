CREATE TABLE "Segment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sourceObject" TEXT NOT NULL,
  "definition" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "updatedDate" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Segment_sourceObject_idx" ON "Segment"("sourceObject");
CREATE INDEX "Segment_updatedDate_idx" ON "Segment"("updatedDate");
