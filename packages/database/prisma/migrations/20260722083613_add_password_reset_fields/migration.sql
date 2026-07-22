/*
  Warnings:

  - A unique constraint covering the columns `[passwordResetToken]` on the table `Individual` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Individual" ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "passwordResetTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Individual_passwordResetToken_key" ON "Individual"("passwordResetToken");

-- CreateIndex
CREATE INDEX "Individual_email_idx" ON "Individual"("email");

-- CreateIndex
CREATE INDEX "Individual_passwordResetToken_idx" ON "Individual"("passwordResetToken");
