ALTER TABLE "Individual" ADD COLUMN "manualEmail" TEXT;
CREATE UNIQUE INDEX "Individual_manualEmail_key" ON "Individual"("manualEmail");
CREATE INDEX "Individual_manualEmail_idx" ON "Individual"("manualEmail");
