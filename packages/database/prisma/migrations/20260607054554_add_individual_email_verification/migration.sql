/*
  Warnings:

  - You are about to drop the column `password` on the `Individual` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Individual` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Individual" DROP COLUMN "password",
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerificationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Individual_email_key" ON "Individual"("email");
