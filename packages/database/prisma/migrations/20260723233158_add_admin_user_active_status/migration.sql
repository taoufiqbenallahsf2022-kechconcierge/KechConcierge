/*
  Warnings:

  - A unique constraint covering the columns `[individualId,channel]` on the table `Consent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Consent" DROP CONSTRAINT "Consent_individualId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Consent_individualId_idx" ON "Consent"("individualId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_individualId_channel_key" ON "Consent"("individualId", "channel");

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE CASCADE ON UPDATE CASCADE;
