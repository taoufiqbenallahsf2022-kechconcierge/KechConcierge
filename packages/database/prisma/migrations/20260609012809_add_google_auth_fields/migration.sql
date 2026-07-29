/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `Individual` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Individual" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Individual_googleId_key" ON "Individual"("googleId");
